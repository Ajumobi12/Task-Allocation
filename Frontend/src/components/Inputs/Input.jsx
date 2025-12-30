import React, { useState } from "react";

function Input({ value, onChange, label, type, placeholder }) {
  const [showPassword, setShowPassword] = useState(false);
  const handleShowPassword = () => {
    setShowPassword(!showPassword);
  };
  return (
    <div>
      <label htmlFor={label} className="text-[13px] text-slate-800">
        {label}
      </label>
      <div className="input-box">
        <input
          type={
            type == "password" ? (showPassword ? "text" : "password") : type
          }
          value={value}
          onChange={onChange}
          className="w-full bg-transparent outline-none"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

export default Input;
