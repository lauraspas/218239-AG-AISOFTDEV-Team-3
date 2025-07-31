import React from "react";

// Set up Inter font via Tailwind config or import in your main index.css:
// @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

const COLORS = {
  blue: "#2563eb",
  blueDark: "#1d4fd7",
  cardBorder: "#e5eaf1",
  placeholder: "#b0b8c9",
  background: "#f1f5fb",
  inputBg: "#f8fafc",
  checkbox: "#2563eb",
};

const StyledButton = ({
  type = "button",
  children,
  className = "",
  ...props
}) => (
  <button
    type={type}
    className={`
      ${className}
      w-full py-3.5 rounded-xl font-semibold text-base transition
      bg-[${COLORS.blue}] text-white shadow
      hover:bg-[${COLORS.blueDark}]
      focus:ring-2 focus:ring-[${COLORS.blue}] focus:outline-none
      active:scale-[0.98]
      disabled:opacity-50
    `}
    {...props}
  >
    {children}
  </button>
);

const InputField = ({
  id,
  label,
  type = "text",
  required = false,
  autoComplete,
  placeholder = "",
  value,
  onChange,
  ...props
}) => (
  <div className="space-y-2">
    <label
      htmlFor={id}
      className="block font-medium text-[#212B36] text-base tracking-tight"
    >
      {label}
    </label>
    <input
      id={id}
      type={type}
      required={required}
      autoComplete={autoComplete}
      placeholder={placeholder}
      className={`
        w-full h-12 px-4 py-2 rounded-xl border
        border-[${COLORS.cardBorder}]
        bg-[${COLORS.inputBg}]
        text-base text-[#212B36] placeholder:text-[${COLORS.placeholder}]
        shadow-sm
        focus:ring-2 focus:ring-[${COLORS.blue}] focus:border-[${COLORS.blue}]
        transition
      `}
      aria-label={label}
      value={value}
      onChange={onChange}
      {...props}
    />
  </div>
);

const AvatarIcon = () => (
  <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center shadow-sm mb-7">
    <svg width="56" height="56" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="20" fill="#E0EDFB" />
      <ellipse cx="20" cy="17" rx="8" ry="8" fill="#2B4865" />
      <ellipse cx="20" cy="36" rx="12" ry="7" fill="#E0EDFB" />
      <ellipse cx="20" cy="17" rx="6" ry="7" fill="#F7C59F" />
      <ellipse cx="20" cy="21" rx="6" ry="2.5" fill="#F9E0C6" />
      {/* Hair */}
      <path d="M12,19 Q14,14 20,13 Q26,14 28,19 L23,19 Q21.5,20 20,18 Q18.5,20 17,19 Z" fill="#2B4865" />
      {/* Face outline */}
      <ellipse cx="20" cy="18" rx="7" ry="7" fill="none" stroke="#2B4865" strokeWidth="1" />
      {/* Smile */}
      <path d="M16 21 Q20 23 24 21" stroke="#C88F36" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* Eyes */}
      <ellipse cx="17.5" cy="17.5" rx="0.8" ry="1" fill="#263858" />
      <ellipse cx="22.5" cy="17.5" rx="0.8" ry="1" fill="#263858" />
    </svg>
  </div>
);

const SocialButton = ({ ariaLabel, children, ...props }) => (
  <button
    type="button"
    aria-label={ariaLabel}
    className={`
      w-12 h-12 flex items-center justify-center 
      rounded-full border border-[${COLORS.cardBorder}] bg-white
      shadow-none
      hover:shadow
      focus:outline-none focus:ring-2 focus:ring-[${COLORS.blue}] 
      transition
    `}
    {...props}
  >
    {children}
  </button>
);

const SocialIconsRow = () => (
  <div className="flex gap-5 mt-4">
    <SocialButton ariaLabel="Sign in with Google">
      {/* Google Icon */}
      <svg width="26" height="26" viewBox="0 0 48 48">
        <g>
          <path fill="#EA4335" d="M24 9.5c3.36 0 5.84 1.46 7.19 2.68l5.3-5.17C32.59 3.27 28.65 1.5 24 1.5 14.96 1.5 7.05 6.98 3.73 14.19l6.95 5.4C12.28 14.13 17.65 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.09 24.5c0-1.61-.15-3.17-.41-4.65H24v9.13h12.42c-.54 2.87-2.17 5.3-4.6 6.93l7.16 5.55c4.17-3.85 6.61-9.53 6.61-16.96z" />
          <path fill="#FBBC05" d="M10.68 28.63a14.81 14.81 0 010-9.25l-6.95-5.4A23.96 23.96 0 001.5 24c0 3.87.93 7.54 2.58 10.78l7.1-6.15z" />
          <path fill="#34A853" d="M24 46.5c6.19 0 11.39-2.05 15.18-5.54l-7.16-5.55c-1.98 1.35-4.54 2.16-7.98 2.16-6.35 0-11.72-4.63-13.62-10.85l-7.1 6.15C7.05 41.02 14.96 46.5 24 46.5z" />
          <path fill="none" d="M1.5 1.5h45v45h-45z" />
        </g>
      </svg>
    </SocialButton>
    <SocialButton ariaLabel="Sign in with Microsoft">
      {/* Microsoft Icon */}
      <svg width="26" height="26" viewBox="0 0 48 48">
        <rect x="4" y="4" width="19" height="19" fill="#F35325" />
        <rect x="25" y="4" width="19" height="19" fill="#81BC06" />
        <rect x="4" y="25" width="19" height="19" fill="#05A6F0" />
        <rect x="25" y="25" width="19" height="19" fill="#FFBA08" />
      </svg>
    </SocialButton>
  </div>
);

const FormContainer = ({ children }) => (
  <div
    className={`
      w-full max-w-md bg-white rounded-3xl shadow-xl
      px-12 py-10
      sm:px-7 sm:py-8
      border border-[${COLORS.cardBorder}]
      flex flex-col gap-7
    `}
    style={{
      fontFamily: `'Inter', 'ui-sans-serif', 'system-ui', sans-serif` // fallback chain
    }}
  >
    {children}
  </div>
);

const RememberMeCheckbox = ({ checked, onChange }) => (
  <label className="inline-flex items-center cursor-pointer select-none text-base">
    <span className="relative">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="
          peer
          appearance-none w-[22px] h-[22px] rounded-md border-2 border-[rgba(229,234,241,1)]
          bg-white checked:bg-[${COLORS.blue}] checked:border-[${COLORS.blue}]
          mr-2 outline-none transition
        "
        style={{ accentColor: COLORS.blue }}
      />
      <svg
        className="absolute pointer-events-none top-[2px] left-[2.5px] w-[17px] h-[17px] fill-none stroke-white opacity-0 peer-checked:opacity-100 transition"
        viewBox="0 0 17 17"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="3.5 9.5 7.5 13.5 13.5 5.5" />
      </svg>
    </span>
    <span className="ml-1 text-[#5B6A79]">Remember me</span>
  </label>
);

const AuthFooter = () => (
  <div className="text-center text-[#858C94] text-sm mt-7">
    {"Don't have an account? "}
    <a href="#" className="text-[#2563eb] font-semibold hover:underline">
      Sign up
    </a>
  </div>
);

// The actual login form
const LoginForm = () => {
  // Optional: Add controlled states as necessary for demo/prototype
  return (
    <div className={`min-h-screen bg-[${COLORS.background}] flex items-center justify-center`}>
      <FormContainer>
        {/* TOP: Avatar & Headline */}
        <div className="flex flex-col items-center -mt-2">
          <AvatarIcon />
          <h2 className="text-3xl font-bold text-[#212B36] mb-1.5 mt-1 leading-tight tracking-tight">
            Welcome Back!
          </h2>
        </div>

        {/* Form */}
        <form className="flex flex-col gap-6" autoComplete="off">
          <InputField
            id="email"
            label="Email"
            type="email"
            required
            autoComplete="username"
            placeholder="Enter your email"
          />
          <InputField
            id="password"
            label="Password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Enter your password"
          />
          <div className="flex items-center justify-between pt-2">
            <RememberMeCheckbox />
            <a
              href="#"
              className="text-[#2563eb] font-semibold hover:underline text-base"
              tabIndex={0}
            >
              Forgot password?
            </a>
          </div>
          <StyledButton type="submit">Login</StyledButton>
        </form>

        {/* Social Actions */}
        <div className="flex flex-col items-center gap-2 mt-2">
          <span className="text-[#9CA3AF] text-[15px] mb-1">or sign in with</span>
          <SocialIconsRow />
        </div>

        {/* Footer */}
        <AuthFooter />
      </FormContainer>
    </div>
  );
};

export default LoginForm;