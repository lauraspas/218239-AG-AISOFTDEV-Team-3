import React from "react";

// StyledButton: General purpose button with customizable props
const StyledButton = ({
  type = "button",
  children,
  className = "",
  ...props
}) => (
  <button
    type={type}
    className={`${className} transition transform focus:outline-none`}
    {...props}
  >
    {children}
  </button>
);

// InputField: Labeled input with full styling and accessibility
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
  <div>
    <label
      htmlFor={id}
      className="block text-gray-700 font-medium mb-1"
    >
      {label}
    </label>
    <input
      id={id}
      type={type}
      required={required}
      autoComplete={autoComplete}
      placeholder={placeholder}
      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 placeholder-gray-400 text-base"
      aria-label={label}
      value={value}
      onChange={onChange}
      {...props}
    />
  </div>
);

// AvatarIcon: The SVG avatar at the top
const AvatarIcon = () => (
  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="20" fill="#E0EDFB"/>
      <ellipse cx="20" cy="17" rx="8" ry="8" fill="#2B4865"/>
      <ellipse cx="20" cy="36" rx="12" ry="7" fill="#E0EDFB"/>
      <ellipse cx="20" cy="17" rx="6" ry="7" fill="#F7C59F"/>
      <ellipse cx="20" cy="21" rx="6" ry="2.5" fill="#F9E0C6"/>
      {/* Hair */}
      <path d="M12,19 Q14,14 20,13 Q26,14 28,19 L23,19 Q21.5,20 20,18 Q18.5,20 17,19 Z" fill="#2B4865"/>
      {/* Face outline */}
      <ellipse cx="20" cy="18" rx="7" ry="7" fill="none" stroke="#2B4865" strokeWidth="1"/>
      {/* Smile */}
      <path d="M16 21 Q20 23 24 21" stroke="#C88F36" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      {/* Eyes */}
      <ellipse cx="17.5" cy="17.5" rx="0.8" ry="1" fill="#263858"/>
      <ellipse cx="22.5" cy="17.5" rx="0.8" ry="1" fill="#263858"/>
    </svg>
  </div>
);

// SocialButton: Button for social sign-ins with icon and label
const SocialButton = ({ ariaLabel, children, ...props }) => (
  <StyledButton
    type="button"
    aria-label={ariaLabel}
    className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-200"
    {...props}
  >
    {children}
  </StyledButton>
);

// SocialIconsRow: The row of Google and Microsoft sign-in buttons
const SocialIconsRow = () => (
  <div className="flex gap-3 mt-3">
    <SocialButton ariaLabel="Sign in with Google">
      {/* Google Icon */}
      <svg width="22" height="22" viewBox="0 0 48 48">
        <g>
          <path fill="#EA4335" d="M24 9.5c3.36 0 5.84 1.46 7.19 2.68l5.3-5.17C32.59 3.27 28.65 1.5 24 1.5 14.96 1.5 7.05 6.98 3.73 14.19l6.95 5.4C12.28 14.13 17.65 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.09 24.5c0-1.61-.15-3.17-.41-4.65H24v9.13h12.42c-.54 2.87-2.17 5.3-4.6 6.93l7.16 5.55c4.17-3.85 6.61-9.53 6.61-16.96z"/>
          <path fill="#FBBC05" d="M10.68 28.63a14.81 14.81 0 010-9.25l-6.95-5.4A23.96 23.96 0 001.5 24c0 3.87.93 7.54 2.58 10.78l7.1-6.15z"/>
          <path fill="#34A853" d="M24 46.5c6.19 0 11.39-2.05 15.18-5.54l-7.16-5.55c-1.98 1.35-4.54 2.16-7.98 2.16-6.35 0-11.72-4.63-13.62-10.85l-7.1 6.15C7.05 41.02 14.96 46.5 24 46.5z"/>
          <path fill="none" d="M1.5 1.5h45v45h-45z"/>
        </g>
      </svg>
    </SocialButton>
    <SocialButton ariaLabel="Sign in with Microsoft">
      {/* Microsoft Icon */}
      <svg width="22" height="22" viewBox="0 0 48 48">
        <rect x="4" y="4" width="19" height="19" fill="#F35325"/>
        <rect x="25" y="4" width="19" height="19" fill="#81BC06"/>
        <rect x="4" y="25" width="19" height="19" fill="#05A6F0"/>
        <rect x="25" y="25" width="19" height="19" fill="#FFBA08"/>
      </svg>
    </SocialButton>
  </div>
);

// FormContainer: The main card wrapper
const FormContainer = ({ children }) => (
  <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
    {children}
  </div>
);

// RememberMeCheckbox: The remember me checkbox with label
const RememberMeCheckbox = ({ checked, onChange }) => (
  <label className="inline-flex items-center">
    <input
      type="checkbox"
      className="rounded focus:ring-blue-400 border-gray-300 text-blue-600"
      checked={checked}
      onChange={onChange}
    />
    <span className="ml-2 text-gray-600">Remember me</span>
  </label>
);

// AuthFooter: Footer for "Don't have an account?"
const AuthFooter = () => (
  <div className="text-center text-gray-500 text-sm mt-7">
    {"Don't have an account? "}
    <a href="#" className="text-blue-500 hover:underline">
      Sign up
    </a>
  </div>
);

// LoginForm: Main composition
const LoginForm = () => {
  // For demonstration, these could be controlled state (optional for demo)
  // If you'd like to make the inputs controlled, add React.useState hooks here.

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f1f5fb]">
      <FormContainer>
        <div className="flex flex-col items-center">
          <AvatarIcon />
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Welcome Back!</h2>
        </div>
        <form className="space-y-4" autoComplete="off">
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
          <div className="flex items-center justify-between text-sm mb-2">
            <RememberMeCheckbox />
            <a href="#" className="text-blue-500 hover:underline font-medium">
              Forgot password?
            </a>
          </div>
          <StyledButton
            type="submit"
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-base hover:bg-blue-700 shadow-sm"
          >
            Login
          </StyledButton>
        </form>
        <div className="flex flex-col items-center mt-5">
          <span className="text-gray-500 text-sm">or sign in with</span>
          <SocialIconsRow />
        </div>
        <AuthFooter />
      </FormContainer>
    </div>
  );
};

export default LoginForm;