import { useMemo } from 'react';
import { DEFAULT_TAXONOMY } from '../lib/categories.js';

const CategorySubcategoryFilter = ({
  taxonomy = DEFAULT_TAXONOMY,
  selectedCategory = 'all',
  selectedSubcategory = 'all',
  onSelectCategory,
  onSelectSubcategory,
  counts = {},
}) => {
  // Determine available subcategories for the active selected category
  const availableSubcategories = useMemo(() => {
    if (selectedCategory === 'all') {
      return taxonomy.flatMap((t) => t.categories);
    }
    const found = taxonomy.find((t) => t.group === selectedCategory);
    return found ? found.categories : [];
  }, [taxonomy, selectedCategory]);

  return (
    <div className="ch-category-filter-system">
      {/* Primary Level: Main Categories + All */}
      <div className="orders-filter-bar main-category-bar">
        <button
          type="button"
          className={`filter-tab ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => {
            onSelectCategory('all');
            onSelectSubcategory('all');
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '5px' }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
          All Categories {counts['all'] !== undefined ? `(${counts['all']})` : ''}
        </button>
        {taxonomy.map((g, idx) => {
          const count = counts[g.group];
          return (
            <button
              key={g.group}
              type="button"
              className={`filter-tab ${selectedCategory === g.group ? 'active' : ''}`}
              onClick={() => {
                onSelectCategory(g.group);
                onSelectSubcategory('all');
              }}
            >
              {idx + 1}. {g.group} {count !== undefined ? `(${count})` : ''}
            </button>
          );
        })}
      </div>

      {/* Secondary Level: Subcategories & Tags */}
      <div className="sub-category-bar">
        <span className="sub-category-label">Subcategories:</span>
        <button
          type="button"
          className={`tag-chip ${selectedSubcategory === 'all' ? 'active' : ''}`}
          onClick={() => onSelectSubcategory('all')}
        >
          All Subcategories
        </button>
        {availableSubcategories.map((sub) => {
          const count = counts[sub];
          return (
            <button
              key={sub}
              type="button"
              className={`tag-chip ${selectedSubcategory === sub ? 'active' : ''}`}
              onClick={() => onSelectSubcategory(sub)}
            >
              {sub} {count !== undefined ? `(${count})` : ''}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategorySubcategoryFilter;
