import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "../ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "../ui/select";
import styles from "./OpportunityFilters.module.css";

const categories = [
  { label: "All", value: "all" },
  { label: "Education", value: "education" },
  { label: "Healthcare", value: "healthcare" },
  { label: "Environment", value: "environment" },
  { label: "Community", value: "community" },
  { label: "Technology", value: "technology" }
];

const sortOptions = [
  { label: "Newest First", value: "newest" },
  { label: "Deadline (Closest)", value: "deadline" },
  { label: "Most Applicants", value: "applicants" },
  { label: "Location", value: "location" }
];

export function OpportunityFilters({
  searchTerm,
  onSearchChange,
  category,
  onCategoryChange,
  sortBy,
  onSortChange
}) {
  return (
    <div className={styles.container}>
      <div className={styles.filtersWrapper}>
        
        {/* Search */}
        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search opportunities..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Category Dropdown */}
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className={styles.selectDropdown}
        >
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>

        {/* Sort Dropdown */}
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className={styles.selectDropdown}
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

      </div>
    </div>
  );
}
