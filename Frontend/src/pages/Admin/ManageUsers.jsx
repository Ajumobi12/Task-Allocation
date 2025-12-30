import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";
import { LuFileSpreadsheet, LuUser } from "react-icons/lu";
import UserCard from "../../components/Cards/UserCard";
import { Link, Navigate } from "react-router-dom";

function ManageUsers() {
  const [allUser, setAllUser] = useState([]);

  const getAllUser = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS);

      if (response.data?.length > 0) {
        setAllUser(response.data);
      }
    } catch (error) {
      console.error("Error fetching all users:", error);
      toast("Error fetching all users");
    }
  };

  //download task Report

  const handleDownloadReport = async () => {
    try {
      const response = await axiosInstance.get(
        API_PATHS.REPORT.EXPORT_USERS_REPORT,
        {
          responseType: "blob",
        }
      );
      //create a URL for the blob

      const url = window.URL.createObjectURL(new Blob([response.data]));
      //create a link element
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "users_details.xlsx");
      document.body.appendChild(link);
      //simulate a click on the link
      link.click();
      link.parentNode.removeChild(link);
      //clean up
      window.URL.revokeObjectURL(url);
      toast("Report downloaded successfully");
    } catch (error) {
      console.error("Error downloading report:", error);
      toast.success("Error downloading report");
    }
  };

  useEffect(() => {
    getAllUser();

    return () => {};
  }, []);

  return (
    <DashboardLayout activeMenu="Team Members">
      <div className="mt-5 mb-10">
        <div className="flex md:flex-row md:items-center justify-between ">
          <h2 className="text-xl font-medium md:text-xl">Team Members</h2>
          <div className="flex gap-10">
            <Link to="/admin/create-user">
              <button className="flex md:flex download-btn">
                <LuUser className="text-lg" />
                Add User
              </button>
            </Link>
            <button
              className="flex md:flex download-btn"
              onClick={handleDownloadReport}
            >
              <LuFileSpreadsheet className="text-lg" />
              Download Report
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-col-3 lg:grid-cols-3 gap-4 mt-4">
          {allUser?.map((user) => (
            <UserCard key={user._id} userInfo={user} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ManageUsers;
