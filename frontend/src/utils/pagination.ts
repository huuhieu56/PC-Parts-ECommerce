export interface RawPage<T> {
  content?: T[];
  totalElements?: number;
  total_elements?: number;
  total?: number;
  total_count?: number;
  totalItems?: number;
  total_items?: number;
  totalRecords?: number;
  total_records?: number;
  totalPages?: number;
  total_pages?: number;
  totalPage?: number;
  total_page?: number;
  pages?: number;
  size?: number;
  pageSize?: number;
  page_size?: number;
  limit?: number;
  per_page?: number;
  perPage?: number;
  pageable?: {
    pageSize?: number;
    page_size?: number;
  };
  pageNumber?: number;
  page_number?: number;
  number?: number;
  hasNext?: boolean;
  has_next?: boolean;
  hasPrevious?: boolean;
  has_previous?: boolean;
  first?: boolean;
  is_first?: boolean;
  last?: boolean;
  is_last?: boolean;
}

export interface NormalizedPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
  isFirst: boolean;
  isLast: boolean;
}

export const normalizePageResult = <T>(rawInput: RawPage<T> | null | undefined): NormalizedPage<T> => {
  const raw = rawInput ?? {};
  const content = Array.isArray(raw.content) ? raw.content : [];

  const totalElementsCandidate = [
    raw.totalElements,
    raw.total_elements,
    raw.total,
    raw.total_count,
    raw.totalItems,
    raw.total_items,
    raw.totalRecords,
    raw.total_records,
  ].find((value) => typeof value === 'number' && Number.isFinite(value)) as number | undefined;
  const totalElements = typeof totalElementsCandidate === 'number' ? totalElementsCandidate : content.length;

  const sizeCandidate = [
    raw.size,
    raw.pageSize,
    raw.page_size,
    raw.limit,
    raw.per_page,
    raw.perPage,
    raw.pageable?.pageSize,
    raw.pageable?.page_size,
  ].find((value) => typeof value === 'number' && Number.isFinite(value)) as number | undefined;
  const pageSize = typeof sizeCandidate === 'number' && sizeCandidate > 0 ? sizeCandidate : content.length;

  const totalPagesCandidate = [
    raw.totalPages,
    raw.total_pages,
    raw.totalPage,
    raw.total_page,
    raw.pages,
  ].find((value) => typeof value === 'number' && Number.isFinite(value) && value >= 0) as number | undefined;

  let totalPages = typeof totalPagesCandidate === 'number' ? totalPagesCandidate : undefined;
  if (typeof totalPages !== 'number' || totalPages <= 0) {
    if (typeof pageSize === 'number' && pageSize > 0) {
      totalPages = Math.ceil(totalElements / pageSize);
    } else {
      totalPages = totalElements > 0 ? 1 : 0;
    }
  }

  const pageNumberCandidate = [
    raw.pageNumber,
    raw.page_number,
    raw.number,
  ].find((value) => typeof value === 'number' && Number.isFinite(value)) as number | undefined;
  const pageNumber = typeof pageNumberCandidate === 'number' ? pageNumberCandidate : 0;

  const hasNext = Boolean(raw.hasNext ?? raw.has_next ?? (pageNumber < totalPages - 1));
  const hasPrevious = Boolean(raw.hasPrevious ?? raw.has_previous ?? (pageNumber > 0));
  const isFirst = Boolean(raw.first ?? raw.is_first ?? (pageNumber === 0));
  const isLast = Boolean(raw.last ?? raw.is_last ?? (pageNumber >= totalPages - 1));

  return {
    content,
    totalElements,
    totalPages,
    pageNumber,
    pageSize,
    hasNext,
    hasPrevious,
    isFirst,
    isLast,
  };
};
