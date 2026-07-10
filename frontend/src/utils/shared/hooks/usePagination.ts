// yss_orbit\frontend\src\shared\hooks\usePagination.ts
import { useState } from 'react';
export const usePagination = (initialPage = 1, initialLimit = 10) => {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  return { page, setPage, limit, setLimit, offset: (page - 1) * limit };
};
