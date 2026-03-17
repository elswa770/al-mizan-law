// Current Page Search Utilities
// This file manages search state for individual pages

let currentPageSearchQueries: { [key: string]: string } = {};

export const shouldSearchInCurrentPage = (pageId: string): boolean => {
  const query = getCurrentPageSearchQuery(pageId);
  return query && query.trim().length > 0;
};

export const getCurrentPageSearchQuery = (pageId: string): string => {
  return currentPageSearchQueries[pageId] || '';
};

export const setCurrentPageSearchQuery = (pageId: string, query: string): void => {
  currentPageSearchQueries[pageId] = query;
};

export const clearCurrentPageSearch = (pageId: string): void => {
  delete currentPageSearchQueries[pageId];
};

export const getAllPageSearchQueries = (): { [key: string]: string } => {
  return { ...currentPageSearchQueries };
};

export const clearAllPageSearchQueries = (): void => {
  currentPageSearchQueries = {};
};
