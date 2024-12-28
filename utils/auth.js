// utils/auth.js

export const checkAdminAuth = () => {
    // Check if there's an admin token or a flag in localStorage
    const adminToken = localStorage.getItem('admin_token');
    return adminToken ? true : false;
  };
  