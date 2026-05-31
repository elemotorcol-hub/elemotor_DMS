import { PaginationDto } from '../../../common/dto/pagination.dto';

/**
 * QueryMyQuoteDto — Client-facing pagination for GET /api/quotes/my.
 * Only exposes page and limit (inherited from PaginationDto).
 */
export class QueryMyQuoteDto extends PaginationDto {}
