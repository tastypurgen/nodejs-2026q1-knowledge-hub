import { SortOrder } from '../enums/sort-order.enum';

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  limit: number;
  data: T[];
}

type SortableValue = boolean | number | string | null | undefined;

function compareValues(
  left: SortableValue,
  right: SortableValue,
  order: SortOrder,
): number {
  if (left === right) {
    return 0;
  }

  if (left === null || left === undefined) {
    return order === SortOrder.ASC ? -1 : 1;
  }

  if (right === null || right === undefined) {
    return order === SortOrder.ASC ? 1 : -1;
  }

  const normalizedLeft =
    typeof left === 'string' ? left.toLowerCase() : Number(left);
  const normalizedRight =
    typeof right === 'string' ? right.toLowerCase() : Number(right);

  if (normalizedLeft < normalizedRight) {
    return order === SortOrder.ASC ? -1 : 1;
  }

  return order === SortOrder.ASC ? 1 : -1;
}

export function applyCollectionQuery<T extends object>(
  items: T[],
  query: { page?: number; limit?: number; sortBy?: string; order?: SortOrder },
): T[] | PaginatedResponse<T> {
  const result = [...items];
  const sortKey = query.sortBy as keyof T | undefined;

  if (sortKey) {
    result.sort((left, right) => {
      const leftValue = left[sortKey] as SortableValue;
      const rightValue = right[sortKey] as SortableValue;
      return compareValues(leftValue, rightValue, query.order ?? SortOrder.ASC);
    });
  }

  const shouldPaginate = query.page !== undefined || query.limit !== undefined;
  if (!shouldPaginate) {
    return result;
  }

  const total = result.length;
  const page = query.page ?? 1;
  const limit = query.limit ?? (total || 1);
  const offset = (page - 1) * limit;

  return {
    total,
    page,
    limit,
    data: result.slice(offset, offset + limit),
  };
}
