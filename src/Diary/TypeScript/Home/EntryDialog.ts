import $ = require('jquery');

/* The state of a modal dialog which can be opened via the show() method. All instances of this class rely
   on the same div from Index.cshtml, which is ok because only one modal dialog can be shown at once. The
   DOM is updated only when show() is called.
*/
export default class EntryDialog {
    // The following properties determine what is shown when show() is called. After the dialog has been
    // closed, these properties will reflect the final state of the dialog.
    isEditable: boolean;
    title: string;
    date: Date;
    location: string;
    text: string;

    // Cache JQuery objects
    private static $modal = $(".modal");
    private static $title_edit = $("#modal_title_edit");
    private static $title_view = $("#modal_title_view");
    private static $date_edit = $("#modal_date_edit");
    private static $date_view = $("#modal_date_view");
    private static $location_edit = $("#modal_location_edit");
    private static $location_view = $("#modal_location_view");
    private static $text_edit = $("#modal_text_edit");
    private static $text_view = $("#modal_text_view");

    // Do once-off configuration, e.g. for TinyMCE.
    static initialize(): void {
        tinymce.init({
            selector: "#modal_text_edit"
        });
    }

    constructor(is_editable: boolean, title: string, date: Date, location: string, text: string) {
        this.isEditable = is_editable;
        this.title = title;
        this.date = date;
        this.location = location;
        this.text = text;
    }

    show(): void {
        EntryDialog.$title_edit.val(this.title);
        EntryDialog.$title_view.text(this.title);
        EntryDialog.$date_edit.val(this.date.toString());
        EntryDialog.$date_view.text(this.date.toString());
        EntryDialog.$location_edit.val(this.location);
        EntryDialog.$location_view.text(this.location);
        EntryDialog.$text_view.html(this.text);
        tinymce.activeEditor.setContent(this.text);

        this.setEditable();

        EntryDialog.$modal.modal("show");
    }

    // Show/hide controls to reflect the current state: editing or viewing. Note that this method does not set content - that needs to be handled elsewhere.
    private setEditable(): void {
        if (this.isEditable) {
            EntryDialog.$title_view.hide();
            EntryDialog.$title_edit.show();
            EntryDialog.$date_view.hide();
            EntryDialog.$date_edit.show();
            EntryDialog.$location_view.hide();
            EntryDialog.$location_edit.show();
            EntryDialog.$text_view.hide();
            EntryDialog.$text_edit.hide();
            tinymce.activeEditor.show();
        } else {
            EntryDialog.$title_view.show();
            EntryDialog.$title_edit.hide();
            EntryDialog.$date_view.show();
            EntryDialog.$date_edit.hide();
            EntryDialog.$location_view.show();
            EntryDialog.$location_edit.hide();
            EntryDialog.$text_view.show();
            tinymce.activeEditor.hide();
            EntryDialog.$text_edit.hide();
        }
    }
}