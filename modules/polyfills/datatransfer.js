/**
 * Object used to hold the data that is being dragged during drag and drop operations.
 *
 * It may hold one or more data items of different types. For more information about
 * drag and drop operations and data transfer objects, see
 * <a href="https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer">HTML Drag and Drop API</a>.
 *
 * This object is created automatically by the @see:DragDrop singleton and is
 * accessible through the @see:dataTransfer property of all drag events.
 */
function DataTransfer() {
  this.dropEffect = 'move';
  this.effectAllowed = 'all';
  this._data = {};
}
Object.defineProperty(DataTransfer.prototype, "types", {
  /**
   * Gets an array of strings giving the formats that were set in the @see:dragstart event.
   */
  get: function () {
    return Object.keys(this._data);
  },
  enumerable: true,
  configurable: true
});
/**
 * Removes the data associated with a given type.
 *
 * The type argument is optional. If the type is empty or not specified, the data
 * associated with all types is removed. If data for the specified type does not exist,
 * or the data transfer contains no data, this method will have no effect.
 *
 * @param type Type of data to remove.
 */
DataTransfer.prototype.clearData = function (type) {
  if (type != null) {
    delete this._data[type];
  } else {
    this._data = {};
  }
};
/**
 * Retrieves the data for a given type, or an empty string if data for that type does
 * not exist or the data transfer contains no data.
 *
 * @param type Type of data to retrieve.
 */
DataTransfer.prototype.getData = function (type) {
  return this._data[type] || '';
};
/**
 * Set the data for a given type.
 *
 * For a list of recommended drag types, please see
 * https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Recommended_Drag_Types.
 *
 * @param type Type of data to add.
 * @param value Data to add.
 */
DataTransfer.prototype.setData = function (type, value) {
  this._data[type] = value;
};
