
import os
from dotenv import load_dotenv
import logging
from contextlib import contextmanager
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Depends, Body
from pydantic import BaseModel, EmailStr, validator
from sqlalchemy import create_engine, Column, Integer, String, Boolean, ForeignKey, Text, DateTime, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker, Session, close_all_sessions
import openai



# --- FastAPI app and logger setup ---
app = FastAPI()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Load environment variables and set OpenAI API key ---
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    logger.error("OPENAI_API_KEY is not set. Please check your .env file or environment variables.")
else:
    openai.api_key = openai_api_key




# --- Chat Endpoint with Multi-Agent LangGraph Integration ---
from fastapi import Body
from typing import TypedDict, List, Any

# LangGraph and LangChain imports
from langgraph.graph import StateGraph
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

# Project root and knowledge base setup
project_root = os.path.abspath(os.path.join(os.getcwd(), '..', '..'))
def create_knowledge_base(file_paths):
    all_docs = []
    for path in file_paths:
        full_path = os.path.join(project_root, path)
        if os.path.exists(full_path):
            loader = TextLoader(full_path)
            docs = loader.load()
            for doc in docs:
                doc.metadata = {"source": path}
            all_docs.extend(docs)
        else:
            logger.warning(f"Artifact not found at {full_path}")
    if not all_docs:
        logger.warning("No documents found to create knowledge base.")
        return None
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    splits = text_splitter.split_documents(all_docs)
    vectorstore = FAISS.from_documents(documents=splits, embedding=OpenAIEmbeddings())
    return vectorstore.as_retriever()

# Specialized retrievers
prd_artifacts = ["artifacts/day1_prd.md"]
tech_artifacts = ["artifacts/schema.sql", "artifacts/adr_001_database_choice.md"]
prd_retriever = create_knowledge_base(prd_artifacts)
tech_retriever = create_knowledge_base(tech_artifacts)


# In-memory session history store
import threading
session_histories = {}
session_lock = threading.Lock()

# Multi-agent state
class AgentState(TypedDict):
    question: str
    documents: List[Any]
    answer: str
    grade: str
    route: str
    source: str
    history: List[dict]

# ProjectManagerAgent: routes to the correct researcher
def project_manager_node(state: AgentState) -> AgentState:
    # Use conversation history for routing
    messages = state.get('history', []) + [
        {"role": "system", "content": "You are a project manager router."},
        {"role": "user", "content": f"You are a project manager. Decide if the user's question is about product requirements or technical details. If the question is about requirements, answer ONLY with 'prd'. If it's about technical details, answer ONLY with 'tech'.\n\nQuestion: {state['question']}"}
    ]
    response = openai.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=messages[-10:]  # Limit to last 10 for efficiency
    )
    agent_response = response.choices[0].message.content.strip().lower()
    state['route'] = agent_response
    return state

# PRDResearcherAgent
def prd_researcher_node(state: AgentState) -> AgentState:
    docs = prd_retriever.get_relevant_documents(state['question']) if prd_retriever else []
    state['documents'] = docs
    state['source'] = 'prd'
    return state

# TechResearcherAgent
def tech_researcher_node(state: AgentState) -> AgentState:
    docs = tech_retriever.get_relevant_documents(state['question']) if tech_retriever else []
    state['documents'] = docs
    state['source'] = 'tech'
    return state

# SynthesizerAgent
def synthesizer_node(state: AgentState) -> AgentState:
    docs_text = '\n\n'.join([doc.page_content for doc in state['documents']])
    # Build conversation history for multi-turn context
    history = state.get('history', [])
    messages = history + [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": f"You are an expert assistant. Use the following context to answer the user's question.\n\nContext:\n{docs_text}\n\nQuestion:\n{state['question']}"}
    ]
    response = openai.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=messages[-10:]  # Limit to last 10 for efficiency
    )
    agent_response = response.choices[0].message.content.strip()
    state['answer'] = agent_response
    return state

# Router condition
def router_condition(state: AgentState):
    if state.get('route', '') == 'prd':
        return 'PRD_RESEARCHER'
    elif state.get('route', '') == 'tech':
        return 'TECH_RESEARCHER'
    else:
        return '__end__'

# Build the multi-agent graph
graph = StateGraph(AgentState)
graph.add_node('PROJECT_MANAGER', project_manager_node)
graph.add_node('PRD_RESEARCHER', prd_researcher_node)
graph.add_node('TECH_RESEARCHER', tech_researcher_node)
graph.add_node('SYNTHESIZER', synthesizer_node)
graph.add_conditional_edges('PROJECT_MANAGER', router_condition)
graph.add_edge('PRD_RESEARCHER', 'SYNTHESIZER')
graph.add_edge('TECH_RESEARCHER', 'SYNTHESIZER')
graph.add_edge('SYNTHESIZER', '__end__')
graph.set_entry_point('PROJECT_MANAGER')
compiled_graph = graph.compile()


import uuid

class ChatRequest(BaseModel):
    question: str
    session_id: Optional[str] = None


@app.post("/chat")
def chat_endpoint(request: ChatRequest = Body(...)):
    """
    Stateless endpoint: Accepts a user's question and returns the multi-agent LangGraph response. Each call is independent.
    """
    initial_state = AgentState(question=request.question, documents=[], answer="", grade="", route="", source="")
    try:
        final_state = compiled_graph.invoke(initial_state)
        answer = final_state.get('answer', 'No answer generated.')
        return {"answer": answer}
    except Exception as e:
        logger.error(f"LangGraph invocation failed: {e}")
        raise HTTPException(status_code=500, detail=f"LangGraph service unavailable: {e}")


# --- Stateful Multi-turn Chat Endpoint ---
from fastapi.responses import JSONResponse


@app.post("/stateful_chat")
def stateful_chat_endpoint(request: ChatRequest = Body(...)):
    """
    Stateful endpoint: Accepts a user's question and session_id, returns the agent's answer and session_id.
    If session_id is not provided, generates a new one.
    Maintains conversation context using LangGraph config and in-memory history.
    """
    session_id = request.session_id or str(uuid.uuid4())
    # Retrieve or initialize conversation history
    with session_lock:
        history = session_histories.get(session_id, [])
    initial_state = AgentState(question=request.question, documents=[], answer="", grade="", route="", source="", history=history)
    try:
        config = {"configurable": {"session_id": session_id}}
        final_state = compiled_graph.invoke(initial_state, config=config)
        answer = final_state.get('answer', 'No answer generated.')
        # Update conversation history
        new_history = history + [
            {"role": "user", "content": request.question},
            {"role": "assistant", "content": answer}
        ]
        with session_lock:
            session_histories[session_id] = new_history[-20:]  # Keep last 20 turns
        return JSONResponse(content={"answer": answer, "session_id": session_id})
    except Exception as e:
        logger.error(f"Stateful LangGraph invocation failed: {e}")
        raise HTTPException(status_code=500, detail=f"LangGraph service unavailable: {e}")

# ...existing code...

# Pydantic model for user data validation
class UserBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    role: str  # Replace constr with a plain string and validate separately

    @validator('role')
    def validate_role(cls, v):
        if v not in ['New Hire', 'Team Manager', 'HR Specialist']:
            raise ValueError("Role must be one of: New Hire, Team Manager, HR Specialist")
        return v

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None  # Replace constr with a plain string and validate separately

    @validator('role', always=True)
    def validate_role(cls, v):
        if v and v not in ['New Hire', 'Team Manager', 'HR Specialist']:
            raise ValueError("Role must be one of: New Hire, Team Manager, HR Specialist")
        return v

class User(UserBase):
    id: int

# SQLAlchemy model for the 'users' table
Base = declarative_base()
class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    role = Column(String, nullable=False)

# SQLAlchemy model for the 'onboarding_tasks' table
class OnboardingTask(Base):
    __tablename__ = 'onboarding_tasks'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    task_name = Column(String, nullable=False)
    description = Column(Text)
    is_completed = Column(Boolean, nullable=False, default=False)
    
    user = relationship("User", back_populates="onboarding_tasks")

User.onboarding_tasks = relationship("OnboardingTask", order_by=OnboardingTask.id, back_populates="user")

# SQLAlchemy model for the 'training_modules' table
class TrainingModule(Base):
    __tablename__ = 'training_modules'

    id = Column(Integer, primary_key=True)
    module_name = Column(String, nullable=False)
    description = Column(Text)
    role = Column(String, nullable=False)

# SQLAlchemy model for the 'user_training_progress' table
class UserTrainingProgress(Base):
    __tablename__ = 'user_training_progress'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    training_module_id = Column(Integer, ForeignKey('training_modules.id'), nullable=False)
    is_completed = Column(Boolean, nullable=False, default=False)
    quiz_score = Column(Integer)
    
    user = relationship("User", back_populates="training_progress")
    training_module = relationship("TrainingModule")

User.training_progress = relationship("UserTrainingProgress", order_by=UserTrainingProgress.id, back_populates="user")

# SQLAlchemy model for the 'documents' table
class Document(Base):
    __tablename__ = 'documents'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    document_name = Column(String, nullable=False)
    is_signed = Column(Boolean, nullable=False, default=False)
    
    user = relationship("User", back_populates="documents")

User.documents = relationship("Document", order_by=Document.id, back_populates="user")

# SQLAlchemy model for the 'communication' table
class Communication(Base):
    __tablename__ = 'communication'
    
    id = Column(Integer, primary_key=True)
    sender_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    receiver_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=func.current_timestamp())

# SQLAlchemy model for the 'feedback' table
class Feedback(Base):
    __tablename__ = 'feedback'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    feedback_text = Column(Text, nullable=False)
    is_anonymous = Column(Boolean, nullable=False, default=True)
    timestamp = Column(DateTime, default=func.current_timestamp())

# Create a SQLAlchemy engine for the 'onboarding.db' database
engine = create_engine('sqlite:///onboarding.db', echo=True)

# Create a configured "Session" class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency function to get the database session
def get_db():
    """
    Dependency function to provide a session for database operations.
    Ensures that the session is properly closed after use.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Add a Pydantic model for the response
class UserResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr
    role: str

    class Config:
        orm_mode = True

# Create a user
@app.post("/users/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    logger.info("Received request to create user: %s", user.dict())
    try:
        # Check if the email already exists
        existing_user = db.query(User).filter(User.email == user.email).first()
        if existing_user:
            logger.warning("Email already registered: %s", user.email)
            raise HTTPException(status_code=400, detail="Email already registered.")

        # Create a new User ORM object from the request data
        db_user = User(
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            role=user.role
        )
        db.add(db_user)  # Add the new user to the session
        db.commit()  # Commit the transaction to persist the data
        db.refresh(db_user)  # Refresh the instance to get the generated ID

        logger.info("User created successfully: %s", db_user)
        return db_user
    except Exception as e:
        logger.error("Error occurred while creating user: %s", str(e))
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Read all users
@app.get("/users/", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()

# Read a single user by ID
@app.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found.")
    return user

# Update a user
@app.put("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found.")

    update_data = user_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)  # Update each field

    db.commit()  # Commit the transaction to persist the changes
    db.refresh(user)  # Refresh the instance to get the updated data

    return user

# Delete a user
@app.delete("/users/{user_id}", response_model=UserResponse)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found.")

    db.delete(user)  # Mark the user for deletion
    db.commit()  # Commit the transaction to persist the changes

    return user

# Ensure all sessions are closed when the application shuts down
@app.on_event("shutdown")
def shutdown_event():
    close_all_sessions()
    logger.info("All database sessions have been closed.")

# Create all tables in the database during application startup
@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    logger.info("All database tables have been created.")

# Main entry point, if running this file directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)