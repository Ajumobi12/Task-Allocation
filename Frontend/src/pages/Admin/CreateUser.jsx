import React, { useContext, useState } from "react";
import AuthLayout from "../../components/layouts/AuthLayout";
import { validateEmail } from "../../utils/helper";
import ProfilePhotoSelector from "../../components/Inputs/ProfilePhotoSelector";
import Input from "../../components/Inputs/Input";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { UserContext } from "../../context/userContext";
import uploadImage from "../../utils/uploadImage";
import DashboardLayout from "../../components/layouts/DashboardLayout";

function CreateUser() {
  const [profilePic, setProfilePic] = useState(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminInviteToken, setAdminInviteToken] = useState("");

  const [error, setError] = useState(null);

  const { updateUser } = useContext(UserContext);
  const navigate = useNavigate();

  // Handle SignUp form
  const handleSignUp = async (e) => {
    e.preventDefault();

    let profileImageUrl = "";

    if (!validateEmail(email)) {
      setError("please enter a valid email address");
      return;
    }
    if (!fullName) {
      setError("please enter a valid email address");
      return;
    }
    if (!password) {
      setError("please enter a password");
      return;
    }

    //SignUp API call

    try {
      if (profilePic) {
        const imgUploadRes = await uploadImage(profilePic);
        profileImageUrl = imgUploadRes.imageUrl || "";
      }

      const response = await axiosInstance.post(API_PATHS.AUTH.REGISTER, {
        name: fullName,
        email,
        password,
        profileImageUrl,
        adminInviteToken,
      });

      const { token, role } = response.data;

      //   if (token) {
      //     localStorage.setItem("token", token);
      //     updateUser(response.data);

      //     if (role === "admin") {
      //       navigate("/admin/dashboard");
      //     } else {
      //       navigate("/user/dashboard");
      //     }
      //   }

      toast.success("User created successfully");
      navigate("/admin/users");
    } catch (error) {
      if (error.response && error.response.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Something went wrong");
      }
    }
  };

  return (
    <DashboardLayout activeMenu="Team Members">
      <div className="lg:w-[80%] h-auto md:full mt-20 flex flex-col justify-center">
        <h3 className="text-xl font-semibold text-black">Add New User</h3>

        <form onSubmit={handleSignUp}>
          <ProfilePhotoSelector image={profilePic} setImage={setProfilePic} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              label="Full Name"
              placeholder="Full Name"
              type="text"
            />
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              label="Email Address"
              type="text"
              placeholder="swift@example.com"
            />
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              label="Password"
              type="password"
              placeholder="Min 8 Characters"
            />
            <Input
              value={adminInviteToken}
              onChange={(e) => setAdminInviteToken(e.target.value)}
              label="Admin Invite Token"
              type="text"
              placeholder="6 digit code"
            />
          </div>
          {error && <p className="text-red-500 text-xs pb-2.5">{error}</p>}

          <button className="btn-primary">Add User</button>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default CreateUser;
