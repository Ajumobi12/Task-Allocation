import React from "react";
import UI_IMG from "../../assets/images/2002.i039.018_remote_management_distant_work_isometric_icons-01.jpg";

function AuthLayout({ children }) {
  return (
    <div className="flex">
      <div className="w-screen h-screen md:w-[60vw] px-20 pt-8 pb-12">
        <h2 className="text-2xl font-medium text-black">Task Manager</h2>
        {children}
      </div>
      <div className="hidden md:flex w-[40vw] items-center justify-center  overflow-hidden p-8 ">
        <img src={UI_IMG} />
      </div>
    </div>
  );
}

export default AuthLayout;
