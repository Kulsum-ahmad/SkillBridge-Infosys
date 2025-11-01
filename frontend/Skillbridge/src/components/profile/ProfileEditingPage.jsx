// src/components/profile/ProfileEditingPage.jsx
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ProfileProgressBar } from "./ProfileProgressBar";
import { toast } from "sonner";
import { CheckCircle2, X, User, Briefcase, FileText } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "../ui/alert-dialog";
import styles from "./ProfilePage.module.css";
import api from "../api";
import { ImageUpload } from "./ImageUpload";
import Navbar from "../Navbar/Navbar"; // Import Navbar

export default function ProfileEditingPage({ userType: propUserType }) {
  // Get userType from localStorage if not passed as prop
  const getUserType = () => {
    if (propUserType) return propUserType;
    try {
      const user = JSON.parse(localStorage.getItem("sb_user") || "{}");
      return user?.userType?.toLowerCase() || "volunteer";
    } catch {
      return "volunteer";
    }
  };
  
  const userType = getUserType();
  
  const [profile, setProfile] = useState({
    image: "",
    name: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    skills: [],
    experience: "",
    availability: "",
    organization: "",
    website: "",
  });
  const [originalProfile, setOriginalProfile] = useState(profile);
  const [currentSkill, setCurrentSkill] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const res = await api.get("/profile/me");
        
        const fetchedData = {
          image: res.data.image || "",
          name: res.data.name || "",
          email: res.data.email || "",
          phone: res.data.phone || "",
          location: res.data.location || "",
          bio: res.data.bio || "",
          skills: res.data.skills || [],
          experience: res.data.experience || "",
          availability: res.data.availability || "",
          organization: res.data.organization || "",
          website: res.data.website || "",
        };
        
        setProfile(fetchedData);
        setOriginalProfile(JSON.parse(JSON.stringify(fetchedData))); // Deep copy
      } catch (err) {
        console.error("Failed to load profile:", err);
        toast.error(err.response?.data?.message || "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Validation
  const validateField = (name, value) => {
    let error = "";
    if (name === "name" && !value.trim()) error = "Name is required";
    if (name === "email") {
      if (!value.trim()) error = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Invalid email format";
    }
    if (name === "phone") {
      if (!value.trim()) error = "Phone number is required";
      else if (!/^\+?[\d\s\-()]+$/.test(value) || value.replace(/\D/g, "").length < 10)
        error = "Invalid phone number";
    }
    if (name === "bio" && value.trim() && value.length < 50) {
      error = "Bio must be at least 50 characters";
    }
    if (name === "organization" && userType === "ngo" && !value.trim())
      error = "Organization is required";
    return error;
  };

  const handleFieldChange = (name, value) => {
    setProfile((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleBlur = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, profile[name]) }));
  };

  // Skills
  const addSkill = () => {
    if (currentSkill.trim() && !profile.skills.includes(currentSkill.trim())) {
      setProfile((prev) => ({ ...prev, skills: [...prev.skills, currentSkill.trim()] }));
      setCurrentSkill("");
    }
  };

  const removeSkill = (skill) => {
    setProfile((prev) => ({ ...prev, skills: prev.skills.filter((s) => s !== skill) }));
  };

  // Profile completeness
  const calculateProgress = () => {
    const fields = [
      profile.image,
      profile.name,
      profile.email,
      profile.phone,
      profile.location,
      profile.bio && profile.bio.length >= 50,
      profile.availability,
    ];
    // Only include skills and experience for non-NGO users
    if (userType !== "ngo") {
      fields.push(profile.skills.length > 0, profile.experience);
    }
    // Add NGO-specific fields
    if (userType === "ngo") {
      fields.push(!!profile.organization, !!profile.website);
    }
    const filledFields = fields.filter(Boolean).length;
    return Math.round((filledFields / fields.length) * 100);
  };

  // Save
  const handleSave = async () => {
    const fieldsToValidate = ["name", "email", "phone"];
    if (profile.bio) fieldsToValidate.push("bio");
    if (userType === "ngo") fieldsToValidate.push("organization");
    const newErrors = {};
    fieldsToValidate.forEach((field) => {
      const error = validateField(field, profile[field]);
      if (error) newErrors[field] = error;
    });
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      setTouched(Object.keys(newErrors).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
      toast.error("Please fix all errors before saving");
      return;
    }
    try {
      setIsSaving(true);
      const res = await api.put("/profile/me", profile);
      
      const updatedProfile = {
        image: res.data.image || "",
        name: res.data.name || "",
        email: res.data.email || "",
        phone: res.data.phone || "",
        location: res.data.location || "",
        bio: res.data.bio || "",
        skills: Array.isArray(res.data.skills) ? [...res.data.skills] : [],
        experience: res.data.experience || "",
        availability: res.data.availability || "",
        organization: res.data.organization || "",
        website: res.data.website || "",
      };
      
      setProfile(updatedProfile);
      setOriginalProfile(JSON.parse(JSON.stringify(updatedProfile))); // Deep copy
      
      // Dispatch event to update navbar
      window.dispatchEvent(new CustomEvent("profile_updated", { detail: { image: updatedProfile.image } }));
      
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 2000);
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error("Failed to save profile:", err);
      toast.error(err.response?.data?.message || "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setProfile(JSON.parse(JSON.stringify(originalProfile))); // Deep copy
    setErrors({}); 
    setTouched({}); 
    setCurrentSkill(""); // Reset current skill input
    toast.info("Changes discarded");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Edit Profile</h1>
          <p className={styles.pageSubtitle}>
            {userType === "ngo" 
              ? "Manage your organization's information" 
              : "Update your personal information and skills"}
          </p>
        </div>

        <ProfileProgressBar progress={calculateProgress()} />

        <div className={styles.profileCard}>
          <Tabs defaultValue="personal" className={styles.tabsWrapper}>
            <TabsList className={styles.tabsList}>
              <TabsTrigger value="personal" className={styles.tabTrigger}>
                <User className={styles.tabIcon} />
                Personal Info
              </TabsTrigger>
              {userType !== "ngo" && (
                <TabsTrigger value="skills" className={styles.tabTrigger}>
                  <Briefcase className={styles.tabIcon} />
                  Skills & Experience
                </TabsTrigger>
              )}
              <TabsTrigger value="bio" className={styles.tabTrigger}>
                <FileText className={styles.tabIcon} />
                Bio & Availability
              </TabsTrigger>
            </TabsList>

            <div className={styles.tabsContentContainer}>
              <TabsContent value="personal" className={styles.tabContent}>
                <ImageUpload
                  key={profile.image}
                  currentImage={profile.image}
                  onImageChange={(url) => setProfile((prev) => ({ ...prev, image: url }))}
                  label={userType === "ngo" ? "Organization Logo" : "Profile Picture"}
                />

                {userType === "ngo" && (
                  <div className={styles.inputGroup}>
                    <Label htmlFor="organization">Organization Name *</Label>
                    <Input
                      id="organization"
                      value={profile.organization}
                      onChange={(e) => handleFieldChange("organization", e.target.value)}
                      onBlur={() => handleBlur("organization")}
                      className={errors.organization && touched.organization ? styles.inputError : ""}
                      placeholder="Organization name"
                    />
                    {errors.organization && touched.organization && <p className={styles.errorText}>{errors.organization}</p>}
                  </div>
                )}

                <div className={styles.inputGroup}>
                  <Label htmlFor="name">{userType === "ngo" ? "Contact Name" : "Full Name"} *</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    onBlur={() => handleBlur("name")}
                    className={errors.name && touched.name ? styles.inputError : ""}
                    placeholder="Full Name"
                  />
                  {errors.name && touched.name && <p className={styles.errorText}>{errors.name}</p>}
                </div>

                <div className={styles.inputGroup}>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    onBlur={() => handleBlur("email")}
                    className={errors.email && touched.email ? styles.inputError : ""}
                    placeholder="your.email@example.com"
                  />
                  {errors.email && touched.email && <p className={styles.errorText}>{errors.email}</p>}
                </div>

                <div className={styles.inputGroup}>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => handleFieldChange("phone", e.target.value)}
                    onBlur={() => handleBlur("phone")}
                    className={errors.phone && touched.phone ? styles.inputError : ""}
                    placeholder="+1 555-123-4567"
                  />
                  {errors.phone && touched.phone && <p className={styles.errorText}>{errors.phone}</p>}
                </div>

                <div className={styles.inputGroup}>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={profile.location}
                    onChange={(e) => handleFieldChange("location", e.target.value)}
                    placeholder="City, Country"
                  />
                </div>

                {userType === "ngo" && (
                  <div className={styles.inputGroup}>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={profile.website}
                      onChange={(e) => handleFieldChange("website", e.target.value)}
                      placeholder="https://www.example.org"
                    />
                  </div>
                )}
              </TabsContent>

              {userType !== "ngo" && (
                <TabsContent value="skills" className={styles.tabContent}>
                  <div className={styles.inputGroup}>
                    <Label htmlFor="skills">Skills</Label>
                    <div className={styles.skillInputWrapper}>
                      <Input
                        id="skills"
                        value={currentSkill}
                        onChange={(e) => setCurrentSkill(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                        placeholder="Add a skill"
                      />
                      <Button type="button" onClick={addSkill}>Add</Button>
                    </div>
                    <div className={styles.skillBadgeContainer}>
                      {profile.skills.map((skill) => (
                        <Badge key={skill}>
                          {skill}
                          <button type="button" onClick={() => removeSkill(skill)}><X size={12} /></button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <Label htmlFor="experience">Experience</Label>
                    <Textarea
                      id="experience"
                      value={profile.experience}
                      onChange={(e) => handleFieldChange("experience", e.target.value)}
                      rows={6}
                      placeholder="Describe your experience..."
                    />
                  </div>
                </TabsContent>
              )}

              <TabsContent value="bio" className={styles.tabContent}>
                <div className={styles.inputGroup}>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => handleFieldChange("bio", e.target.value)}
                    onBlur={() => handleBlur("bio")}
                    rows={8}
                    placeholder={userType === "ngo" ? "Tell us about your organization (minimum 50 characters)..." : "Tell us about yourself (minimum 50 characters)..."}
                  />
                  {errors.bio && touched.bio && <p className={styles.errorText}>{errors.bio}</p>}
                  {profile.bio && profile.bio.length < 50 && (
                    <p className={styles.hintText}>{50 - profile.bio.length} characters remaining</p>
                  )}
                </div>

                <div className={styles.inputGroup}>
                  <Label htmlFor="availability">Availability</Label>
                  <Input
                    id="availability"
                    value={profile.availability}
                    onChange={(e) => handleFieldChange("availability", e.target.value)}
                    placeholder="e.g., Weekends, 10-15 hrs/week"
                  />
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <div className={styles.saveFooter}>
            <Button variant="outline" type="button" onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <AlertDialogTitle>Profile Updated!</AlertDialogTitle>
              <AlertDialogDescription>Your profile has been successfully saved.</AlertDialogDescription>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  } 