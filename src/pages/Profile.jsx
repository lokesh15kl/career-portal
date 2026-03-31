import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  changeCurrentUserPassword,
  getCurrentUser,
  updateCurrentUserProfile
} from "../services/api";
import ThemeToggle from "../components/ThemeToggle";

export default function Profile() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState("");
  const [displayName, setDisplayName] = useState("Student");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [profileNameInput, setProfileNameInput] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await getCurrentUser();
        const resolvedName = user?.name || user?.fullName || user?.email?.split("@")[0] || "Student";
        setDisplayName(resolvedName);
        setProfileNameInput(resolvedName);
        setUserEmail(String(user?.email || ""));
        setProfileImageUrl(String(user?.profileImageUrl || ""));
      } catch {
        setDisplayName("Student");
        setProfileNameInput("Student");
        setUserEmail("");
        setProfileImageUrl("");
      }
    };

    loadUser();
  }, []);

  const initials = displayName.trim().charAt(0).toUpperCase() || "S";

  const onProfileImageSelected = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setProfileMessage("Please choose an image file.");
      return;
    }

    if (file.size > 1_500_000) {
      setProfileMessage("Image size should be below 1.5 MB.");
      return;
    }

    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Unable to read selected image."));
      reader.readAsDataURL(file);
    });

    setProfileImageUrl(dataUrl);
    setProfileMessage("Image selected. Click Save Profile to apply.");
  };

  const onSaveProfile = async () => {
    setProfileMessage("");
    setProfileSaving(true);

    try {
      const result = await updateCurrentUserProfile({
        name: profileNameInput,
        profileImageUrl
      });

      const nextName = String(result?.name || profileNameInput || "Student");
      const nextImage = String(result?.profileImageUrl || profileImageUrl || "");
      setDisplayName(nextName);
      setProfileNameInput(nextName);
      setProfileImageUrl(nextImage);
      setProfileMessage("Profile updated successfully.");
    } catch (error) {
      setProfileMessage(error?.message || "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const onChangePassword = async () => {
    setPasswordMessage("");

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordMessage("Please fill all password fields.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage("New password and confirm password do not match.");
      return;
    }

    setPasswordSaving(true);
    try {
      const result = await changeCurrentUserPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordMessage(result?.message || "Password updated successfully.");
    } catch (error) {
      setPasswordMessage(error?.message || "Failed to update password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="profile-page-shell">
      <header className="profile-page-topbar">
        <div className="profile-page-header">
          <button onClick={() => navigate(-1)} className="profile-back-btn">← Back</button>
          <div>
            <h1 className="profile-page-title">Profile Settings</h1>
            <p className="profile-page-subtitle">Update your profile details, image, and password.</p>
          </div>
        </div>

        <div className="topbar-actions">
          <ThemeToggle />
        </div>
      </header>

      <main className="profile-page-content">
        <div className="profile-page-grid">
          <div className="profile-page-avatar-section">
            <div className="profile-page-avatar">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="Profile" className="profile-avatar-image" />
              ) : (
                <span className="profile-avatar-initials">{initials}</span>
              )}
            </div>
            <p className="profile-page-email">{userEmail}</p>
          </div>

          <div className="profile-page-form-section">
            <div className="profile-page-card">
              <h2 className="profile-card-title">Basic Info</h2>

              <label className="profile-form-label">Email</label>
              <input
                className="profile-form-input"
                value={userEmail}
                readOnly
                disabled
              />

              <label className="profile-form-label">Name</label>
              <input
                className="profile-form-input"
                value={profileNameInput}
                onChange={(event) => setProfileNameInput(event.target.value)}
                placeholder="Enter your name"
              />

              <label className="profile-form-label">Profile Image</label>
              <input
                type="file"
                accept="image/*"
                className="profile-form-input"
                onChange={onProfileImageSelected}
              />

              <button
                type="button"
                className="profile-save-btn"
                onClick={onSaveProfile}
                disabled={profileSaving}
              >
                {profileSaving ? "Saving..." : "Save Profile"}
              </button>

              {profileMessage ? <p className="profile-message">{profileMessage}</p> : null}
            </div>

            <div className="profile-page-card">
              <h2 className="profile-card-title">Change Password</h2>

              <label className="profile-form-label">Current Password</label>
              <input
                type="password"
                className="profile-form-input"
                value={passwordForm.currentPassword}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
              />

              <label className="profile-form-label">New Password</label>
              <input
                type="password"
                className="profile-form-input"
                value={passwordForm.newPassword}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
              />

              <label className="profile-form-label">Confirm New Password</label>
              <input
                type="password"
                className="profile-form-input"
                value={passwordForm.confirmPassword}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
              />

              <button
                type="button"
                className="profile-save-btn"
                onClick={onChangePassword}
                disabled={passwordSaving}
              >
                {passwordSaving ? "Updating..." : "Update Password"}
              </button>

              {passwordMessage ? <p className="profile-message">{passwordMessage}</p> : null}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
