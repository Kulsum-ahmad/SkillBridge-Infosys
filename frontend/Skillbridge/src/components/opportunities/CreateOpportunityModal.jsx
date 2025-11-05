import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select";
import { Badge } from "../ui/badge";
import { X } from "lucide-react";
import { toast } from "sonner";
import api from "../api";
import styles from "./CreateOpportunityModal.module.css";

const allowedCategories = ["education", "healthcare", "environment", "community", "technology"];

export function CreateOpportunityModal({
  open,
  onOpenChange,
  onCreateOpportunity,
  opportunityToEdit,
}) {
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    location: "",
    deadline: "",
    duration: "",
    description: "",
    required_skills: [], // ✅ Changed from 'skills' to 'required_skills'
  });

  const [currentSkill, setCurrentSkill] = useState("");

  // 🧠 Load data for edit or reset on open
  useEffect(() => {
    if (opportunityToEdit) {
      setFormData({
        title: opportunityToEdit.title || "",
        category: opportunityToEdit.category || "",
        location: opportunityToEdit.location || "",
        deadline: opportunityToEdit.deadline ? opportunityToEdit.deadline.split("T")[0] : "",
        duration: opportunityToEdit.duration || "",
        description: opportunityToEdit.description || "",
        required_skills: opportunityToEdit.required_skills || [], // ✅ Fixed field name
      });
    } else if (open) {
      setFormData({
        title: "",
        category: "",
        location: "",
        deadline: "",
        duration: "",
        description: "",
        required_skills: [], // ✅ Fixed field name
      });
      setCurrentSkill("");
    }
  }, [opportunityToEdit, open]);

  // ➕ Add Skill
  const addSkill = () => {
    const skill = currentSkill.trim();
    if (!skill) {
      toast.warning("Please enter a skill");
      return;
    }
    if (formData.required_skills.includes(skill)) {
      toast.warning("This skill is already added");
      return;
    }
    setFormData((prev) => ({ 
      ...prev, 
      required_skills: [...prev.required_skills, skill] 
    }));
    setCurrentSkill("");
    toast.success(`Skill "${skill}" added`);
  };

  // ❌ Remove Skill
  const removeSkill = (skill) => {
    setFormData((prev) => ({
      ...prev,
      required_skills: prev.required_skills.filter((s) => s !== skill),
    }));
    toast.success(`Skill "${skill}" removed`);
  };

  // ✅ Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.category || !formData.location || !formData.deadline || !formData.duration) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!allowedCategories.includes(formData.category)) {
      toast.error("Please select a valid category");
      return;
    }

    // ✅ Validate skills
    if (!formData.required_skills || formData.required_skills.length === 0) {
      toast.error("Please add at least one skill");
      return;
    }

    try {
      const payload = { 
        ...formData, 
        deadline: new Date(formData.deadline).toISOString(),
        required_skills: formData.required_skills // ✅ Ensure it's sent as array
      };

      console.log("📤 Sending payload:", payload);

      let response;

      if (opportunityToEdit?._id) {
        response = await api.put(`/opportunities/${opportunityToEdit._id}`, payload);
        toast.success("✅ Opportunity updated successfully!");
      } else {
        response = await api.post("/opportunities", payload);
        toast.success("✅ Opportunity created successfully!");
      }

      console.log("✅ Response:", response.data);

      onCreateOpportunity(response.data);
      
      // Reset form
      setFormData({
        title: "",
        category: "",
        location: "",
        deadline: "",
        duration: "",
        description: "",
        required_skills: [],
      });
      setCurrentSkill("");
      onOpenChange(false);
    } catch (error) {
      console.error("❌ Error creating/updating opportunity:", error);
      const errorMsg = error.response?.data?.message || 
                       error.response?.data?.error || 
                       "Failed to create/update opportunity";
      toast.error(errorMsg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.dialogContent}>
        <DialogHeader>
          <DialogTitle>
            {opportunityToEdit ? "Edit Opportunity" : "Create New Opportunity"}
          </DialogTitle>
          <DialogDescription>
            Fill in the details {opportunityToEdit ? "to update" : "to create"} a volunteer opportunity
          </DialogDescription>
        </DialogHeader>

        <div className={styles.formWrapper}>
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Title */}
            <div className={styles.inputGroup}>
              <Label htmlFor="title">Opportunity Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Beach Cleanup Volunteer"
                required
              />
            </div>

            {/* Category */}
            <div className={styles.inputGroup}>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(val) => setFormData((prev) => ({ ...prev, category: val }))}
              >
                <SelectTrigger id="category" className={styles.selectTrigger}>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent position="popper" className={styles.selectContent}>
                  {allowedCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location + Deadline */}
            <div className={styles.twoColumnGrid}>
              <div className={styles.inputGroup}>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="City, Country"
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <Label htmlFor="deadline">Deadline *</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData((prev) => ({ ...prev, deadline: e.target.value }))}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
            </div>

            {/* Duration */}
            <div className={styles.inputGroup}>
              <Label htmlFor="duration">Duration *</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.value }))}
                placeholder="e.g., 3 weeks, 10 hours/week"
                required
              />
            </div>

            {/* ✅ Required Skills */}
            <div className={styles.inputGroup}>
              <Label htmlFor="skills">Required Skills *</Label>
              <div className={styles.skillInputWrapper}>
                <Input
                  id="skills"
                  value={currentSkill}
                  onChange={(e) => setCurrentSkill(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  placeholder="Add a skill and press Enter or click Add"
                />
                <Button type="button" onClick={addSkill}>
                  Add
                </Button>
              </div>
              {formData.required_skills.length > 0 && (
                <div className={styles.skillBadgeContainer}>
                  {formData.required_skills.map((skill) => (
                    <Badge key={skill} className={styles.skillBadge}>
                      {skill}
                      <button 
                        type="button" 
                        onClick={() => removeSkill(skill)}
                        className={styles.removeSkillBtn}
                      >
                        <X size={12} />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              {formData.required_skills.length === 0 && (
                <p className={styles.helperText}>Add at least one skill</p>
              )}
            </div>

            {/* Description */}
            <div className={styles.inputGroup}>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                rows={5}
                placeholder="Describe the opportunity, requirements, and expectations..."
              />
            </div>
          </form>
        </div>

        <DialogFooter className={styles.footer}>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit}>
            {opportunityToEdit ? "Update Opportunity" : "Create Opportunity"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}