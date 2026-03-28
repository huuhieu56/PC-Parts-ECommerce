package com.pcparts.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Standard paginated response wrapper.
 * Provides comprehensive pagination metadata for frontend consumption.
 *
 * <p>Usage with factory method (preferred):
 * <pre>{@code
 * Page<Entity> page = repository.findAll(pageable);
 * PageResponse<Dto> response = PageResponse.from(page, entity -> toDto(entity));
 * }</pre>
 *
 * @param <T> type of the content items
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResponse<T> {

    /** List of items on the current page. */
    private List<T> content;

    /** Current page number (0-indexed). */
    private int page;

    /** Page size (number of items per page). */
    private int size;

    /** Total number of items across all pages. */
    private long totalElements;

    /** Total number of pages. */
    private int totalPages;

    /** Whether this is the last page. */
    private boolean last;

    /** Whether this is the first page. */
    private boolean first;

    /** Whether there is a next page. */
    private boolean hasNext;

    /** Whether there is a previous page. */
    private boolean hasPrevious;

    /** Whether the page has no content. */
    private boolean empty;

    /**
     * Creates a PageResponse from a Spring Data Page with a mapper function.
     * This is the preferred way to create PageResponse instances.
     *
     * @param page   the Spring Data Page
     * @param mapper function to convert entities to DTOs
     * @param <E>    entity type
     * @param <D>    DTO type
     * @return a fully populated PageResponse
     */
    public static <E, D> PageResponse<D> from(Page<E> page, Function<E, D> mapper) {
        List<D> content = page.getContent().stream()
                .map(mapper)
                .collect(Collectors.toList());
        return PageResponse.<D>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .first(page.isFirst())
                .hasNext(page.hasNext())
                .hasPrevious(page.hasPrevious())
                .empty(page.isEmpty())
                .build();
    }

    /**
     * Creates a PageResponse from a Spring Data Page with pre-mapped content.
     *
     * @param page    the Spring Data Page (used for metadata only)
     * @param content pre-mapped content list
     * @param <D>     DTO type
     * @return a fully populated PageResponse
     */
    public static <D> PageResponse<D> from(Page<?> page, List<D> content) {
        return PageResponse.<D>builder()
                .content(content)
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .first(page.isFirst())
                .hasNext(page.hasNext())
                .hasPrevious(page.hasPrevious())
                .empty(page.isEmpty())
                .build();
    }
}
