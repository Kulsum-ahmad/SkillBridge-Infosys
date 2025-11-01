// OpportunityFilters.jsx
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "../ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/select";
import styles from './OpportunityFilters.module.css';

const categories = ["all", "education", "healthcare", "environment", "community", "technology"];

export function OpportunityFilters({ searchTerm, onSearchChange, category, onCategoryChange, sortBy, onSortChange }) {
  return (
    <div className={styles.container}>
      <div className={styles.filtersWrapper}>

        {/* Search Input */}
        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} />
          <Input
            placeholder="Search opportunities..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Category Select */}
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger className={styles.selectTrigger}>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort By Select */}
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className={styles.selectTrigger}>
            <SlidersHorizontal className={styles.sortIcon} />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="deadline">Deadline (Closest)</SelectItem>
            <SelectItem value="applicants">Most Applicants</SelectItem>
            <SelectItem value="location">Location</SelectItem>
          </SelectContent>
        </Select>

      </div>
    </div>
  );
}
