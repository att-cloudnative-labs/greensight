package com.att.eg.cptl.capacityplanning.backend.controller.util.trash;

import static com.att.eg.cptl.capacityplanning.backend.util.Constants.TIMESTAMP_TIME_ZONE;

import com.att.eg.cptl.capacityplanning.backend.dao.TreeNodeRepository;
import com.att.eg.cptl.capacityplanning.backend.exception.TrashStateException;
import com.att.eg.cptl.capacityplanning.backend.model.Trashable;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

/**
 * Utility class for dealing with any Trashable objects.
 *
 * @param <I> The ID type for the underlying MongoRepository to use.
 */
@Component
public class TrashUtil {

  /**
   * Trash a list of items using the underlying MongoRepository.
   *
   * @param trashableItems The List of items to trash.
   * @param repository The MongoRepository to use to Trash the items.
   * @param <S> The type of object to trash, which must be an instanceof Trashable.
   */
  public <S extends Trashable> void trashItems(
      List<S> trashableItems, TreeNodeRepository repository) {
    trashableItems.forEach(
        trashableItem -> {
          trashableItem.setTrashedDate(ZonedDateTime.now(ZoneId.of(TIMESTAMP_TIME_ZONE)));
          repository.trash(trashableItem.getId(), trashableItem.getVersion(), "");
        });
  }

  /**
   * Trash an item using the underlying MongoRepository.
   *
   * @param trashableItem The item to trash.
   * @param repository The MongoRepository to use to trash the item.
   * @param <S> The type of object to trash, which must be an instanceof Trashable.
   */
  public <S extends Trashable> void trashItem(S trashableItem, TreeNodeRepository repository) {
    this.trashItems(Collections.singletonList(trashableItem), repository);
  }

  /**
   * Restore a list of items using the underlying MongoRepository.
   *
   * @param trashableItems The List of items to restore.
   * @param repository The MongoRepository to use to restore the items.
   * @param <S> The type of object to restore, which must be an instanceof Trashable.
   */
  public <S extends Trashable> void restoreItems(
      List<S> trashableItems, TreeNodeRepository repository) {
    trashableItems.forEach(
        trashableItem -> {
          if (trashableItem.getTrashed() == null || !trashableItem.getTrashed()) {
            throw new TrashStateException(
                "Item of type "
                    + trashableItem.getClass().getSimpleName()
                    + " with ID \""
                    + trashableItem.getId()
                    + "\" cannot be recovered - It is currently not trashed.");
          }
          repository.restore(trashableItem.getId());
        });
  }

  /**
   * Restore an item using the underlying MongoRepository.
   *
   * @param trashableItem The item to restore.
   * @param repository The MongoRepository to use to restore the item.
   * @param <S> The type of object to restore, which must be an instanceof Trashable.
   */
  public <S extends Trashable> void restoreItem(S trashableItem, TreeNodeRepository repository) {
    this.restoreItems(Collections.singletonList(trashableItem), repository);
  }

  /**
   * Filters trashed items to either no trashed items or all trashed items.
   *
   * @param trashableItems The List of items to filter.
   * @param showTrashed true if trash should be shown (exclusively), false if trash should be
   *     hidden.
   * @param <T> The type of the List of items, which must be an instanceof Trashable.
   * @return The filtered list.
   */
  public <T extends Trashable> List<T> filterTrashedItems(
      List<T> trashableItems, boolean showTrashed) {
    if (showTrashed) {
      return trashableItems
          .stream()
          .filter(trashableItem -> trashableItem.getTrashed() != null && trashableItem.getTrashed())
          .collect(Collectors.toList());
    }
    return trashableItems
        .stream()
        .filter(trashableItem -> trashableItem.getTrashed() == null || !trashableItem.getTrashed())
        .collect(Collectors.toList());
  }

  /**
   * Returns true if an item is considered trashed, false otherwise.
   *
   * @param trashableItem The object to check.
   * @param <T> The type of object to check. Must be an instanceof Trashable.
   * @return true if the item is trashed, false if the flag is set to false or null.
   */
  public <T extends Trashable> boolean isItemTrashed(T trashableItem) {
    return trashableItem.getTrashed() != null && trashableItem.getTrashed();
  }
}
