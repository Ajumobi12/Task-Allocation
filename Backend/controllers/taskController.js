const Task = require("../models/Task");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate(
      "assignedTo",
      "name email profileImageUrl"
    );
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getTasks = async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};
    if (status) {
      filter.status = status;
    }
    let tasks;

    if (req.user.role === "admin") {
      tasks = await Task.find(filter).populate(
        "assignedTo",
        "name email profileImageUrl"
      );
    } else {
      tasks = await Task.find({ assignedTo: req.user._id, ...filter }).populate(
        "assignedTo",
        "name email profileImageUrl"
      );
    }

    //Add completed todoChecklist count to each task

    tasks = await Promise.all(
      tasks.map(async (task) => {
        const completedCount = task.todoChecklist.filter(
          (item) => item.completed
        ).length;
        return {
          ...task._doc, //include all existing task data
          completedTodoCount: completedCount,
        };
      })
    );
    //status summary counts
    const allTasks = await Task.countDocuments(
      req.user.role === "admin" ? {} : { assignedTo: req.user._id }
    );
    const pendingTasks = await Task.countDocuments({
      ...filter,
      status: "Pending",
      ...(req.user.role !== "admin" && { assignedTo: req.user._id }),
    });

    const inProgressTasks = await Task.countDocuments({
      ...filter,
      status: "In Progress",
      ...(req.user.role !== "admin" && { assignedTo: req.user._id }),
    });

    const completedTasks = await Task.countDocuments({
      ...filter,
      status: "Completed",
      ...(req.user.role !== "admin" && { assignedTo: req.user._id }),
    });

    res.json({
      tasks,
      statusSummary: {
        all: allTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// const createTask = async (req, res) => {
//   try {
//     const {
//       title,
//       description,
//       priority,
//       dueDate,
//       assignedTo,
//       attachments,
//       todoChecklist,
//     } = req.body;

//     if (!Array.isArray(assignedTo)) {
//       return res
//         .status(400)
//         .json({ message: "Assigned To must be an array of user ids" });
//     }
//     const task = await Task.create({
//       title,
//       description,
//       priority,
//       dueDate,
//       assignedTo,
//       attachmentss,
//       todoChecklist,
//       createdBy: req.user._id,
//     });
//     res.status(201).json({ message: "Task created successfully", task });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      dueDate,
      assignedTo,
      attachments,
      todoChecklist,
    } = req.body;

    if (!Array.isArray(assignedTo)) {
      return res
        .status(400)
        .json({ message: "Assigned To must be an array of user ids" });
    }

    // 1️⃣ Create the task
    const task = await Task.create({
      title,
      description,
      priority,
      dueDate,
      assignedTo,
      attachments,
      todoChecklist,
      createdBy: req.user._id,
    });

    // 2️⃣ Fetch assigned users’ emails
    const users = await User.find({ _id: { $in: assignedTo } }).select(
      "name email"
    );

    if (users.length > 0) {
      // 3️⃣ Configure the mail transporter
      const transporter = nodemailer.createTransport({
        // service: "gmail",

          host: "smtp.gmail.com",                  // Gmail SMTP server
          port: 587,                               // TLS port
          secure: false,                           // false for TLS (587)

        auth: {
          user: process.env.SMTP_USER, // e.g. your Gmail or SMTP user
          pass: process.env.SMTP_PASS, // App password or SMTP password
        },
      });

      // 4️⃣ Loop through assigned users and send the email
      for (const user of users) {
        const mailOptions = {
          from: `"Task Management System" <${process.env.SMTP_USER}>`,
          to: user.email,
          subject: `New Task Assigned: ${title}`,
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.5;">
              <h2 style="color: #2c3e50;">New Task Assigned</h2>
              <p>Dear ${user.name || "User"},</p>
              <p>You have been assigned a new task in the system.</p>
              <p><strong>Task:</strong> ${title}</p>
              <p><strong>Priority:</strong> ${priority}</p>
              <p><strong>Due Date:</strong> ${
                dueDate ? new Date(dueDate).toDateString() : "Not specified"
              }</p>
              <p><strong>Description:</strong> ${description || "N/A"}</p>
              <p>Please log in to your dashboard to view and manage this task.</p>
              <hr/>
              <p style="font-size: 12px; color: #777;">This is an automated message. Do not reply.</p>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);
      }
    }

    // 5️⃣ Respond to frontend
    res
      .status(201)
      .json({ message: "Task created and notifications sent", task });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// const updateTask = async (req, res) => {
//   try {
//     const task = await Task.findById(req.params.id);

//     if (!task) return res.status(404).json({ message: "Task not found" });

//     task.title = req.body.title || task.title;
//     task.description = req.body.description || task.description;
//     task.priority = req.body.priority || task.priority;
//     task.dueDate = req.body.dueDate || task.dueDate;
//     task.attachments = req.body.attachments || task.attachments;
//     task.todoChecklist = req.body.todoChecklist || task.todoChecklist;
//     if (req.body.assignedTo) {
//       if (!Array.isArray(req.body.assignedTo)) {
//         return res
//           .status(400)
//           .json({ message: "Assigned To must be an array of user ids" });
//       }

//       task.assignedTo = req.body.assignedTo;
//     }
//     const updatedTask = await task.save();

//     // After task is saved
//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//     });

//     for (const userId of task.assignedTo) {
//       const user = await User.findById(userId);
//       if (user && user.email) {
//         await transporter.sendMail({
//           from: `"Task Manager" <${process.env.EMAIL_USER}>`,
//           to: user.email,
//           subject: "Task Updated",
//           text: `Hi ${user.name},\n\nThe task "${task.title}" has been updated.\n\nPlease log in to view the latest details.`,
//         });
//       }
//     }

//     res.json({ message: "Task updated successfully", task: updatedTask });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    //  Update fields safely
    task.title = req.body.title || task.title;
    task.description = req.body.description || task.description;
    task.priority = req.body.priority || task.priority;
    task.dueDate = req.body.dueDate || task.dueDate;
    task.attachments = req.body.attachments || task.attachments;
    task.todoChecklist = req.body.todoChecklist || task.todoChecklist;

    //  Validate and update "assignedTo"
    if (req.body.assignedTo) {
      if (!Array.isArray(req.body.assignedTo)) {
        return res
          .status(400)
          .json({ message: "Assigned To must be an array of user ids" });
      }
      task.assignedTo = req.body.assignedTo;
    }

    const updatedTask = await task.save();

    // ✅ Setup transporter
    const transporter = nodemailer.createTransport({
       // service: "gmail",

          host: "smtp.gmail.com",                  // Gmail SMTP server
          port: 587,                               // TLS port
          secure: false,                           // false for TLS (587)
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Optional: verify connection
    transporter.verify((error, success) => {
      if (error) {
        console.error("Email connection failed:", error);
      } else {
        console.log("Email connection successful!");
      }
    });

    // ✅ Notify all assigned users
    for (const userId of task.assignedTo) {
      const user = await User.findById(userId);
      if (user && user.email) {
        try {
          await transporter.sendMail({
            from: `"Task Manager" <${process.env.SMTP_USER}>`,
            to: user.email,
            subject: "Task Updated",
            text: `Hi ${user.name},\n\nThe task "${
              task.title
            }" has been updated.\n\nPriority: ${
              task.priority
            }\nDue Date: ${new Date(
              task.dueDate
            ).toDateString()}\n\nPlease log in to view the latest details.`,
          });
          console.log(`✅ Email sent to ${user.email}`);
        } catch (err) {
          console.error(
            `❌ Failed to send email to ${user.email}:`,
            err.message
          );
        }
      }
    }

    res.status(200).json({
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    await task.deleteOne();
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const isAssigned = task.assignedTo.some(
      (userId) => userId.toString() === req.user._id.toString()
    );

    if (!isAssigned && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    task.status = req.body.status || task.status;

    if (task.status === "Completed") {
      task.todoChecklist.forEach((item) => {
        item.completed = true;
      });
      task.progress = 100;
    }
    await task.save();
    res.json({ message: "Task status updated successfully", task });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateTaskChecklist = async (req, res) => {
  try {
    const { todoChecklist } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    if (!task.assignedTo.includes(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    task.todoChecklist = todoChecklist;

    const completedCount = task.todoChecklist.filter(
      (item) => item.completed
    ).length;
    const totalItems = task.todoChecklist.length;
    task.progress =
      totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

    if (task.progress === 100) {
      task.status = "Completed";
    } else if (task.progress > 0) {
      task.status = "In Progress";
    } else {
      task.status = "Pending";
    }

    await task.save();

    const updatedTask = await Task.findById(req.params.id).populate(
      "assignedTo",
      "name email profileImageUrl"
    );

    res.json({
      message: "Task checklist updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getDashboardData = async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments();
    const pendingTasks = await Task.countDocuments({ status: "Pending" });
    const completedTasks = await Task.countDocuments({ status: "Completed" });
    const overdueTasks = await Task.countDocuments({
      status: { $ne: "Completed" },
      dueDate: { $lt: new Date() },
    });

    const taskStatuses = ["Pending", "In Progress", "Completed"];
    const taskDistributionRaw = await Task.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const taskDistribution = taskStatuses.reduce((acc, status) => {
      const formattedKey = status.replace(/\s+/g, "");
      acc[formattedKey] =
        taskDistributionRaw.find((item) => item._id === status)?.count || 0;
      return acc;
    }, {});

    taskDistribution["All"] = totalTasks;

    const taskPriorities = ["Low", "Medium", "High"];
    const taskPriorityLevelsRaw = await Task.aggregate([
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]);

    const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
      acc[priority] =
        taskPriorityLevelsRaw.find((item) => item._id === priority)?.count || 0;
      return acc;
    }, {});

    //fetch recent 10
    const recentTasks = await Task.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select("title status priority dueDate createdAt");

    res.status(200).json({
      statistics: {
        totalTasks,
        pendingTasks,
        completedTasks,
        overdueTasks,
      },
      charts: {
        taskDistribution,
        taskPriorityLevels,
      },
      recentTasks,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getUserDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;
    const totalTasks = await Task.countDocuments({ assignedTo: userId });
    const pendingTasks = await Task.countDocuments({
      assignedTo: userId,
      status: "Pending",
    });
    const completedTasks = await Task.countDocuments({
      assignedTo: userId,
      status: "Completed",
    });
    const overdueTasks = await Task.countDocuments({
      assignedTo: userId,
      status: { $ne: "Completed" },
      dueDate: { $lt: new Date() },
    });

    //Task distribution by status

    const taskStatuses = ["Pending", "In Progress", "Completed"];
    const taskDistributionRaw = await Task.aggregate([
      {
        $match: {
          assignedTo: userId,
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const taskDistribution = taskStatuses.reduce((acc, status) => {
      const formattedKey = status.replace(/\s+/g, "");
      acc[formattedKey] =
        taskDistributionRaw.find((item) => item._id === status)?.count || 0;
      return acc;
    }, {});

    taskDistribution["All"] = totalTasks;

    //Task priority levels
    const taskPriorities = ["Low", "Medium", "High"];
    const taskPriorityLevelsRaw = await Task.aggregate([
      {
        $match: {
          assignedTo: userId,
        },
      },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]);

    const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
      acc[priority] =
        taskPriorityLevelsRaw.find((item) => item._id === priority)?.count || 0;
      return acc;
    }, {});

    //fetch recent 10 task for the logged in user
    const recentTasks = await Task.find({ assignedTo: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("title status priority dueDate createdAt");

    res.status(200).json({
      statistics: {
        totalTasks,
        pendingTasks,
        completedTasks,
        overdueTasks,
      },
      charts: {
        taskDistribution,
        taskPriorityLevels,
      },
      recentTasks,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  updateTaskChecklist,
  getDashboardData,
  getUserDashboardData,
};
