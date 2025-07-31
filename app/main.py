from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional, List
from datetime import datetime
from threading import Lock
import logging
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint,
    create_engine
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker, Session
from sqlalchemy.sql import func

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Inventory Management System API",
    description="A comprehensive inventory management system for warehouses",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Database Configuration ----
SQLALCHEMY_DATABASE_URL = "sqlite:///./inventory.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """FastAPI dependency that provides a SQLAlchemy session."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---- SQLAlchemy Models ----

class User(Base):
    """Represents a system user (warehouse worker, manager, etc.)."""
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, nullable=False, unique=True)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    role = Column(String, nullable=False)
    is_active = Column(Integer, nullable=False, default=1, server_default="1")
    created_at = Column(DateTime, nullable=False, server_default=func.current_timestamp())

    # Relationships
    stock_movements = relationship("StockMovement", back_populates="user")

class Warehouse(Base):
    """Represents a warehouse location."""
    __tablename__ = 'warehouses'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    address = Column(Text)
    phone = Column(String)
    is_active = Column(Integer, nullable=False, default=1, server_default="1")
    created_at = Column(DateTime, nullable=False, server_default=func.current_timestamp())

    # Relationships
    inventory_levels = relationship("InventoryLevel", back_populates="warehouse")
    stock_movements = relationship("StockMovement", back_populates="warehouse")
    reorder_alerts = relationship("ReorderAlert", back_populates="warehouse")

class Supplier(Base):
    """Represents a product supplier."""
    __tablename__ = 'suppliers'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    contact_name = Column(String)
    phone = Column(String)
    email = Column(String)
    address = Column(Text)
    is_active = Column(Integer, nullable=False, default=1, server_default="1")
    created_at = Column(DateTime, nullable=False, server_default=func.current_timestamp())

    # Relationships
    products = relationship("Product", back_populates="supplier")

class Product(Base):
    """Represents an inventory product."""
    __tablename__ = 'products'

    id = Column(Integer, primary_key=True, autoincrement=True)
    sku = Column(String, nullable=False, unique=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    barcode = Column(String, unique=True)
    category = Column(String)  # Added category field
    price = Column(Integer, default=0, server_default="0")  # Added price field (in cents)
    stock = Column(Integer, default=0, server_default="0")  # Added stock field
    supplier_id = Column(Integer, ForeignKey('suppliers.id'))
    reorder_point = Column(Integer, default=0, server_default="0")
    reorder_quantity = Column(Integer, default=0, server_default="0")
    lead_time_days = Column(Integer, default=0, server_default="0")
    is_active = Column(Integer, nullable=False, default=1, server_default="1")
    created_at = Column(DateTime, nullable=False, server_default=func.current_timestamp())

    # Relationships
    supplier = relationship("Supplier", back_populates="products")
    inventory_levels = relationship("InventoryLevel", back_populates="product")
    stock_movements = relationship("StockMovement", back_populates="product")
    reorder_alerts = relationship("ReorderAlert", back_populates="product")

class InventoryLevel(Base):
    """Tracks the quantity of a product in a warehouse."""
    __tablename__ = 'inventory_levels'
    __table_args__ = (
        UniqueConstraint('product_id', 'warehouse_id', name='uix_product_warehouse'),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey('products.id'), nullable=False)
    warehouse_id = Column(Integer, ForeignKey('warehouses.id'), nullable=False)
    quantity = Column(Integer, nullable=False, default=0, server_default="0")
    last_updated = Column(DateTime, nullable=False, server_default=func.current_timestamp())

    # Relationships
    product = relationship("Product", back_populates="inventory_levels")
    warehouse = relationship("Warehouse", back_populates="inventory_levels")

class StockMovement(Base):
    """Logs inbound/outbound/adjustment stock movements."""
    __tablename__ = 'stock_movements'

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey('products.id'), nullable=False)
    warehouse_id = Column(Integer, ForeignKey('warehouses.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'))
    movement_type = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    reason = Column(Text)
    reference_number = Column(String)
    created_at = Column(DateTime, nullable=False, server_default=func.current_timestamp())

    # Relationships
    product = relationship("Product", back_populates="stock_movements")
    warehouse = relationship("Warehouse", back_populates="stock_movements")
    user = relationship("User", back_populates="stock_movements")

class ReorderAlert(Base):
    """Tracks reorder alerts for products in warehouses."""
    __tablename__ = 'reorder_alerts'

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey('products.id'), nullable=False)
    warehouse_id = Column(Integer, ForeignKey('warehouses.id'), nullable=False)
    triggered_at = Column(DateTime, nullable=False, server_default=func.current_timestamp())
    suggested_quantity = Column(Integer, nullable=False)
    is_resolved = Column(Integer, nullable=False, default=0, server_default="0")
    resolved_at = Column(DateTime)

    # Relationships
    product = relationship("Product", back_populates="reorder_alerts")
    warehouse = relationship("Warehouse", back_populates="reorder_alerts")

# ---- Pydantic Models ----

class UserRole:
    """Constants for user roles."""
    WAREHOUSE_WORKER = "Warehouse Worker"
    INVENTORY_MANAGER = "Inventory Manager"
    PROCUREMENT_OFFICER = "Procurement Officer"
    
    @classmethod
    def all_roles(cls):
        return [cls.WAREHOUSE_WORKER, cls.INVENTORY_MANAGER, cls.PROCUREMENT_OFFICER]

class MovementType:
    """Constants for stock movement types."""
    INBOUND = "INBOUND"
    OUTBOUND = "OUTBOUND"
    ADJUSTMENT = "ADJUSTMENT"
    TRANSFER = "TRANSFER"
    DAMAGED = "DAMAGED"

class ProductBase(BaseModel):
    """Base product model with common fields."""
    sku: str = Field(..., example="SKU12345", description="Stock Keeping Unit")
    name: str = Field(..., example="Widget", description="Product name")
    description: Optional[str] = Field(None, example="A useful widget")
    barcode: Optional[str] = Field(None, example="0123456789012")
    category: Optional[str] = Field(None, example="Electronics", description="Product category")
    price: Optional[float] = Field(0, example=99.99, ge=0, description="Product price in dollars")
    stock: Optional[int] = Field(0, example=50, ge=0, description="Current stock quantity")
    supplier_id: Optional[int] = Field(None, example=1)
    reorder_point: Optional[int] = Field(0, example=10, ge=0)
    reorder_quantity: Optional[int] = Field(0, example=50, ge=0)
    lead_time_days: Optional[int] = Field(0, example=7, ge=0)
    is_active: Optional[bool] = Field(True, example=True)

class ProductCreate(ProductBase):
    """Model for creating a new product."""
    pass

class ProductUpdate(BaseModel):
    """Model for updating an existing product."""
    sku: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    barcode: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = Field(None, ge=0)
    stock: Optional[int] = Field(None, ge=0)
    supplier_id: Optional[int] = None
    reorder_point: Optional[int] = Field(None, ge=0)
    reorder_quantity: Optional[int] = Field(None, ge=0)
    lead_time_days: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None

class ProductResponse(ProductBase):
    """Model for product responses."""
    id: int
    created_at: datetime
    
    @classmethod
    def from_orm(cls, obj):
        # Convert price from cents to dollars
        obj_dict = {
            'id': obj.id,
            'sku': obj.sku,
            'name': obj.name,
            'description': obj.description,
            'barcode': obj.barcode,
            'category': obj.category,
            'price': (obj.price or 0) / 100.0,  # Convert cents to dollars
            'stock': obj.stock,
            'supplier_id': obj.supplier_id,
            'reorder_point': obj.reorder_point,
            'reorder_quantity': obj.reorder_quantity,
            'lead_time_days': obj.lead_time_days,
            'is_active': bool(obj.is_active),
            'created_at': obj.created_at
        }
        return cls(**obj_dict)

    class Config:
        orm_mode = True

class UserBase(BaseModel):
    """Base user model."""
    username: str = Field(..., example="jdoe")
    full_name: str = Field(..., example="John Doe")
    email: EmailStr = Field(..., example="john.doe@company.com")
    role: str = Field(..., example="Warehouse Worker")
    is_active: bool = Field(True, example=True)

    @validator('role')
    def validate_role(cls, v):
        if v not in UserRole.all_roles():
            raise ValueError(f"Role must be one of: {', '.join(UserRole.all_roles())}")
        return v

class UserCreate(UserBase):
    """Model for creating a new user."""
    password: str = Field(..., min_length=8, example="securepassword123")

class UserUpdate(BaseModel):
    """Model for updating an existing user."""
    username: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

    @validator('role')
    def validate_role(cls, v):
        if v and v not in UserRole.all_roles():
            raise ValueError(f"Role must be one of: {', '.join(UserRole.all_roles())}")
        return v

class UserResponse(UserBase):
    """Model for user responses."""
    id: int
    created_at: datetime

    class Config:
        orm_mode = True


# ---- API Endpoints ----


# ---- Product API Endpoints (Database-backed) ----

from fastapi.encoders import jsonable_encoder

@app.post("/products/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(product_in: ProductCreate, db: Session = Depends(get_db)):
    """Create a new product (DB-backed)."""
    try:
        # Check for unique SKU and barcode
        existing = db.query(Product).filter(Product.sku == product_in.sku).first()
        if existing:
            raise HTTPException(status_code=400, detail="SKU already exists")
        if product_in.barcode:
            existing_barcode = db.query(Product).filter(Product.barcode == product_in.barcode).first()
            if existing_barcode:
                raise HTTPException(status_code=400, detail="Barcode already exists")

        db_product = Product(
            sku=product_in.sku,
            name=product_in.name,
            description=product_in.description,
            barcode=product_in.barcode,
            category=product_in.category,
            price=int((product_in.price or 0) * 100),  # Convert dollars to cents
            stock=product_in.stock or 0,
            supplier_id=product_in.supplier_id,
            reorder_point=product_in.reorder_point or 0,
            reorder_quantity=product_in.reorder_quantity or 0,
            lead_time_days=product_in.lead_time_days or 0,
            is_active=1 if product_in.is_active else 0
        )
        db.add(db_product)
        db.commit()
        db.refresh(db_product)
        logger.info(f"Created product with ID: {db_product.id}")
        return ProductResponse.from_orm(db_product)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating product: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/products/", response_model=List[ProductResponse])
async def list_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all products with optional pagination (DB-backed)."""
    try:
        products = db.query(Product).offset(skip).limit(limit).all()
        return [ProductResponse.from_orm(product) for product in products]
    except Exception as e:
        logger.error(f"Error listing products: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get a product by its ID (DB-backed)."""
    try:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        return ProductResponse.from_orm(product)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting product {product_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(product_id: int, product_in: ProductUpdate, db: Session = Depends(get_db)):
    """Update an existing product (DB-backed)."""
    try:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        update_data = product_in.dict(exclude_unset=True)

        # Check unique constraints
        if "sku" in update_data:
            existing = db.query(Product).filter(Product.sku == update_data["sku"], Product.id != product_id).first()
            if existing:
                raise HTTPException(status_code=400, detail="SKU already exists")
        if "barcode" in update_data and update_data["barcode"] is not None:
            existing_barcode = db.query(Product).filter(Product.barcode == update_data["barcode"], Product.id != product_id).first()
            if existing_barcode:
                raise HTTPException(status_code=400, detail="Barcode already exists")

        for key, value in update_data.items():
            if key == "is_active":
                setattr(product, key, 1 if value else 0)
            elif key == "price":
                setattr(product, key, int(value * 100) if value is not None else 0)  # Convert dollars to cents
            else:
                setattr(product, key, value)
        db.commit()
        db.refresh(product)
        logger.info(f"Updated product with ID: {product_id}")
        return ProductResponse.from_orm(product)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating product {product_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(product_id: int, db: Session = Depends(get_db)):
    """Delete a product by its ID (DB-backed)."""
    try:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        db.delete(product)
        db.commit()
        logger.info(f"Deleted product with ID: {product_id}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting product {product_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.utcnow()}

@app.post("/seed-data")
async def seed_data(db: Session = Depends(get_db)):
    """Seed the database with sample products for testing."""
    try:
        # Check if data already exists
        existing_count = db.query(Product).count()
        if existing_count > 0:
            return {"message": f"Database already has {existing_count} products"}
        
        sample_products = [
            {
                "sku": "PM001",
                "name": "PixelMate",
                "description": "High-resolution digital display device",
                "category": "Electronics",
                "price": 49900,  # $499 in cents
                "stock": 95
            },
            {
                "sku": "FL002", 
                "name": "FusionLink",
                "description": "Wireless connectivity adapter",
                "category": "Electronics",
                "price": 29900,  # $299 in cents
                "stock": 34
            },
            {
                "sku": "VL003",
                "name": "VelvetLux",
                "description": "Premium textile product",
                "category": "Apparel",
                "price": 9900,  # $99 in cents
                "stock": 60
            },
            {
                "sku": "US004",
                "name": "UrbanSync Knit",
                "description": "Modern urban style knitted apparel",
                "category": "Apparel", 
                "price": 12900,  # $129 in cents
                "stock": 150
            },
            {
                "sku": "HF005",
                "name": "HealthFlow",
                "description": "Personal wellness monitoring device",
                "category": "Wellness",
                "price": 19900,  # $199 in cents
                "stock": 8  # Low stock
            },
            {
                "sku": "TS006",
                "name": "TranquilSet",
                "description": "Comfortable furniture set for relaxation",
                "category": "Furniture",
                "price": 39900,  # $399 in cents
                "stock": 0  # Out of stock
            },
            {
                "sku": "CC007",
                "name": "ComfortCove",
                "description": "Ergonomic seating solution",
                "category": "Furniture",
                "price": 34900,  # $349 in cents
                "stock": 18
            }
        ]
        
        for product_data in sample_products:
            db_product = Product(**product_data)
            db.add(db_product)
        
        db.commit()
        logger.info(f"Seeded database with {len(sample_products)} sample products")
        return {"message": f"Successfully seeded {len(sample_products)} products"}
        
    except Exception as e:
        logger.error(f"Error seeding data: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to seed data")

# ---- Startup Events ----

@app.on_event("startup")
async def startup_event():
    """Initialize database tables on startup."""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {str(e)}")

# ---- Main Entry Point ----

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )