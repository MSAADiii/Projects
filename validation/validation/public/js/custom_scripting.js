frappe.views.ListView.prototype.reorder_listview_fields = function () {
    let fields_order = [];
    let fields = JSON.parse(this.list_view_settings.fields);
 
    fields_order.push(this.columns[0]);
    fields_order.push(this.columns[1]);

    // for (let col in this.columns) {
    //     fields_order.push(this.columns[col]);
    // }
    //this.columns.splice(0, 2);

    for (let fld in fields) {
        for (let col in this.columns) {
            let field = fields[fld];
            let column = this.columns[col];

            if (column.type == "Status" && field.fieldname == "status_field") {
                fields_order.push(column);
                break;
            } else if (column.type == "Field" && field.fieldname === column.df.fieldname) {
                fields_order.push(column);
                break;
            }
        }
    }

    return fields_order;
}

frappe.views.ListView.prototype.setup_columns = function () {
    // setup columns for list view
    this.columns = [];

    const get_df = frappe.meta.get_docfield.bind(null, this.doctype);

    // 1st column: title_field or name
    if (this.meta.title_field) {
        this.columns.push({
            type: "Subject",
            df: get_df(this.meta.title_field),
        });
    } else {
        this.columns.push({
            type: "Subject",
            df: {
                label: __("ID"),
                fieldname: "name",
            },
        });
    }


    this.columns.push({
        type: "Tag"
    });

    // 2nd column: Status indicator
    if (frappe.has_indicator(this.doctype)) {
        // indicator
        this.columns.push({
            type: "Status",
        });
    }

    const fields_in_list_view = this.get_fields_in_list_view();
    // Add rest from in_list_view docfields
    this.columns = this.columns.concat(
        fields_in_list_view
            .filter((df) => {
                if (
                    frappe.has_indicator(this.doctype) &&
                    df.fieldname === "status"
                ) {
                    return false;
                }
                if (!df.in_list_view) {
                    return false;
                }
                return df.fieldname !== this.meta.title_field;
            })
            .map((df) => ({
                type: "Field",
                df,
            }))
    );

    // if (this.list_view_settings.fields) {
    //     this.columns = this.reorder_listview_fields();
    // }

    // limit max to 8 columns if no total_fields is set in List View Settings
    // Screen with low density no of columns 4
    // Screen with medium density no of columns 6
    // Screen with high density no of columns 8
    let total_fields = 600;

    // if (window.innerWidth <= 1366) {
    //     total_fields = 4;
    // } else if (window.innerWidth >= 1920) {
    //     total_fields = 8;
    // }

    this.columns = this.columns.slice(0, total_fields);

    if (
        !this.settings.hide_name_column &&
        this.meta.title_field &&
        this.meta.title_field !== 'name'
    ) {
        this.columns.push({
            type: "Field",
            df: {
                label: __("ID"),
                fieldname: "name",
            },
        });
    }
}


/* Don't delete this file */
var invalidfields = [];
var isCustomForm = 0; 
let has_errors = false;
frappe.ui.form.ControlData.prototype.bind_change_event = function () {

    const change_handler = e => {

        var me = this;

        if (this.change) {
            me.change(e);
        } else {
            let value = me.get_input_value();
            me.parse_validate_and_set_in_model(value, e);
        }
    };

    this.$input.on("change", change_handler);
    if (this.trigger_change_on_input_event && !this.in_grid()) {
        // debounce to avoid repeated validations on value change
        this.$input.on("input", frappe.utils.debounce(change_handler, 500));
    }
    if (this.df.masking) {
        var mask = this.df.masking_format;
        // console.log('mask', mask);
        // this.$input.inputmask({ "mask": mask });
        this.$input.mask(mask);
        this.$input.attr("placeholder", mask);
    }
    if (this.df.validation && this.df.validation == 'Date') {
        if (this.df.date_range == 'Past') {
            this.$input.datepicker({
                maxDate: new Date()
            });
        }
        if (this.df.date_range == 'Future') {
            this.$input.datepicker({
                minDate: new Date()
            });
        }
    }


    // console.log('this.$input', this.$input);
    this.$input.on("focusout", (e) => {
        let me = this;
        let df = me.df;
        let doc = me.doc;
        let errorfields = [];
        has_errors = false;
        var validationTypes = {
            'Name': /^[a-zA-Z\s._-]+$/,
            'INT': /^[0-9]+$/,
            'PASSPORT': /^[A-Z]{2}\d{7}[A-Z]{0,1}$/,
            'FLOAT': /^[+-]?\d+(\.\d+)?$/,
            'IBAN': /^[A-Z]{2}\d{2}[A-Z\d]{1,30}$/,
            'URL': /^(https?|ftp):\/\/([A-Za-z0-9]+([A-Za-z0-9-]*[A-Za-z0-9]+)*\.)+[A-Za-z]{2,7}(:[0-9]+)?(\/.*)?$/,
            'Mobile': /^(03[0-9]{2}[\-][0-9]{7})$/,
            'Phone': /^(?:\+92|0)?[1-9][0-9]{1,2}[1-9][0-9]{6}$/,
            'Email': /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
            'CNIC': /^[0-9]{5}-[0-9]{7}-[0-9]{1}$/,
            'CNIC1': /^\d{5}-?\d{7}-?\d{1}$/
        };

        if (df.validation) {
            var values = this.$input.val();
            if (df.validation == 'Custom') {
                // console.log('CUSTOM', df.regex.replace("\\/", "").replace("\/", "").replace("$/", "$"));
                validationTypes['Custom'] = new RegExp(df.regex.replace("\\/", "").replace("\/", "").replace("$/", "$"));
                // console.log("validationTypes", validationTypes);
            }
            if (validationTypes[df.validation]) {
                var valid = validationTypes[df.validation].test(values);
                if (!valid && values !== '') {
                    this.df.invalid = true;
                    if (this.df.reqd !== 1) {
                        this.df.reqds = 1;
                    }
                    has_errors = true;
                    var labelmessage = df.label;
                    if (df.throw_error == 1 && df.error_message != '') {
                        labelmessage += ' (' + df.error_message + ')';
                    }
                    errorfields.push(__(labelmessage));
                } else if (valid) {
                    this.df.invalid = false;
                    if (this.df.reqds === 1) {
                        this.df.reqds = 0;
                    }
                }
            } else if (df.validation == 'Date') {
                var selectedDate = new Date(values);
                var currentDate = new Date();
                if (df.date_range == 'Past' && selectedDate > currentDate) {
                    this.df.invalid = true;
                    if (this.df.reqd !== 1) {
                        this.df.reqds = 1;
                    }
                    has_errors = true;
                    var labelmessage = df.label;
                    if (df.throw_error == 1 && df.error_message != '') {
                        labelmessage += ' (' + df.error_message + ')';
                    }
                    errorfields.push(__(labelmessage));
                } else if (df.date_range == 'Future' && selectedDate < currentDate) {
                    this.df.invalid = true;
                    if (this.df.reqd !== 1) {
                        this.df.reqds = 1;
                    }
                    has_errors = true;
                    var labelmessage = df.label;
                    if (df.throw_error == 1 && df.error_message != '') {
                        labelmessage += ' (' + df.error_message + ')';
                    }
                    errorfields.push(__(labelmessage));
                } else {
                    this.df.invalid = false;
                    if (this.df.reqds === 1) {
                        this.df.reqds = 0;
                    }
                }
            }

        }

        if (errorfields.length > 0 && invalidfields.length == 0) {
            var message = __("<b>Fields contains invalid value in {0}</b>", [__(doc.doctype)]);
            message = message + "<br><ul><li>" + errorfields.join("</li><li>") + "</ul>";



            frappe.msgprint({
                message: message,
                indicator: "red",
                title: __("Invalid Fields"),
            });
            this.set_invalid();

        } else {
            this.set_invalid();
        }

    });


}

frappe.ui.form.save = function (frm, action, callback, btn) {

    let me = frm;
    let doc = frm;


    $(btn).prop("disabled", true);

    // specified here because there are keyboard shortcuts to save
    var working_label = {
        "Save": __("Saving"),
        "Submit": __("Submitting"),
        "Update": __("Updating"),
        "Amend": __("Amending"),
        "Cancel": __("Cancelling")
    }[toTitle(action)];
    // console.log('AAA check_mandatory aa', me);


    var freeze_message = working_label ? __(working_label) : "";

    var save = function () {
        remove_empty_rows();
        // console.log('AAAA', action);
        $(frm.wrapper).addClass('validated-form');




        if ((action !== 'Save' || frm.is_dirty()) && check_mandatory()) {
            _call({
                method: "frappe.desk.form.save.savedocs",
                args: { doc: frm.doc, action: action },
                callback: function (r) {
                    $(document).trigger("save", [frm.doc]);
                    callback(r);
                },
                error: function (r) {
                    callback(r);
                },
                btn: btn,
                freeze_message: freeze_message
            });
        } else {
            !frm.is_dirty() && frappe.show_alert({ message: __("No changes in document"), indicator: "orange" });
            $(btn).prop("disabled", false);
        }
    };

    var remove_empty_rows = function () {
        /*
            This function removes empty rows. Note that in this function, a row is considered
            empty if the fields with `in_list_view: 1` are undefined or falsy because that's
            what users also consider to be an empty row
        */
        const docs = frappe.model.get_all_docs(frm.doc);

        // we should only worry about table data
        const tables = docs.filter(d => {
            return frappe.model.is_table(d.doctype);
        });

        let modified_table_fields = [];

        tables.map(doc => {
            const cells = frappe.meta.docfield_list[doc.doctype] || [];

            const in_list_view_cells = cells.filter((df) => {
                return cint(df.in_list_view) === 1;
            });

            const is_empty_row = function (cells) {
                for (let i = 0; i < cells.length; i++) {
                    if (locals[doc.doctype][doc.name][cells[i].fieldname]) {
                        return false;
                    }
                }
                return true;
            };

            if (is_empty_row(in_list_view_cells)) {
                frappe.model.clear_doc(doc.doctype, doc.name);
                modified_table_fields.push(doc.parentfield);
            }
        });

        modified_table_fields.forEach(field => {
            frm.refresh_field(field);
        });
    };

    var cancel = function () {
        var args = {
            doctype: frm.doc.doctype,
            name: frm.doc.name
        };

        // update workflow state value if workflow exists
        var workflow_state_fieldname = frappe.workflow.get_state_fieldname(frm.doctype);
        if (workflow_state_fieldname) {
            $.extend(args, {
                workflow_state_fieldname: workflow_state_fieldname,
                workflow_state: frm.doc[workflow_state_fieldname]

            });
        }

        _call({
            method: "frappe.desk.form.save.cancel",
            args: args,
            callback: function (r) {
                $(document).trigger("save", [frm.doc]);
                callback(r);
            },
            btn: btn,
            freeze_message: freeze_message
        });
    };

    var check_mandatory = function () {
        has_errors = false;
        frm.scroll_set = false;

        if (frm.doc.docstatus == 2) return true; // don't check for cancel

        $.each(frappe.model.get_all_docs(frm.doc), function (i, doc) {
            var error_fields = [];
            var folded = false;

            $.each(frappe.meta.docfield_list[doc.doctype] || [], function (i, docfield) {
                if (docfield.fieldname) {
                    const df = frappe.meta.get_docfield(doc.doctype,
                        docfield.fieldname, doc.name);

                    if (df.fieldtype === "Fold") {
                        folded = frm.layout.folded;
                    }

                    if (df.reqd && !frappe.model.has_value(doc.doctype, doc.name, df.fieldname)) {
                        has_errors = true;
                        error_fields[error_fields.length] = __(df.label);
                        // scroll to field
                        if (!frm.scroll_set) {
                            scroll_to(doc.parentfield || df.fieldname);
                        }

                        if (folded) {
                            frm.layout.unfold();
                            folded = false;
                        }
                    }

                }
            });

            if (frm.is_new() && frm.meta.autoname === 'Prompt' && !frm.doc.__newname) {
                error_fields = [__('Name'), ...error_fields];
                // console.log("error_fields", error_fields);
            }

            if (error_fields.length) {
                let meta = frappe.get_meta(doc.doctype);
                if (meta.istable) {
                    var message = __('Mandatory fields required in table {0}, Row {1}',
                        [__(frappe.meta.docfield_map[doc.parenttype][doc.parentfield].label).bold(), doc.idx]);
                } else {
                    var message = __('Mandatory fields required in {0}', [__(doc.doctype)]);
                }
                message = message + '<br><br><ul><li>' + error_fields.join('</li><li>') + "</ul>";
                frappe.msgprint({
                    message: message,
                    indicator: 'red',
                    title: __('Missing Fields')
                });
                frm.refresh();
            }
        });

        return !has_errors;
    };
    let is_docfield_mandatory = function (doc, df) {
        if (df.reqd) return true;
        if (!df.mandatory_depends_on || !doc) return;

        let out = null;
        let expression = df.mandatory_depends_on;
        let parent = frappe.get_meta(df.parent);

        if (typeof expression === "boolean") {
            out = expression;
        } else if (typeof expression === "function") {
            out = expression(doc);
        } else if (expression.substr(0, 5) == "eval:") {
            try {
                out = frappe.utils.eval(expression.substr(5), { doc, parent });
                if (parent && parent.istable && expression.includes("is_submittable")) {
                    out = true;
                }
            } catch (e) {
                frappe.throw(__('Invalid "mandatory_depends_on" expression'));
            }
        } else {
            var value = doc[expression];
            if ($.isArray(value)) {
                out = !!value.length;
            } else {
                out = !!value;
            }
        }

        return out;
    };
    var error_fields = [];
    invalidfields = [];

    $.each(frappe.model.get_all_docs(me.doc), function (i, doc) {

        var folded = false;
        // console.log('doc', doc);
        $.each(frappe.meta.docfield_list[doc.doctype] || [], function (i, docfield) {
            // console.log('docfield', docfield);
            if (docfield.fieldname) {
                const df = frappe.meta.get_docfield(doc.doctype, docfield.fieldname, doc.name);
                if (df) {
                    // console.log('save df ', df);
                    if (df.fieldtype && df.fieldtype === "Fold") {
                        folded = me.layout.folded;
                    }

                    var validationTypes = {
                        'Name': /^[a-zA-Z\s._-]+$/,
                        'INT': /^[0-9]+$/,
                        'PASSPORT': /^[A-Z]{2}\d{7}[A-Z]{0,1}$/,
                        'FLOAT': /^[+-]?\d+(\.\d+)?$/,
                        'IBAN': /^[A-Z]{2}\d{2}[A-Z\d]{1,30}$/,
                        'URL': /^(https?|ftp):\/\/([A-Za-z0-9]+([A-Za-z0-9-]*[A-Za-z0-9]+)*\.)+[A-Za-z]{2,7}(:[0-9]+)?(\/.*)?$/,
                        'Mobile': /^(03[0-9]{2}[\-][0-9]{7})$/,
                        'Phone': /^(?:\+92|0)?[1-9][0-9]{1,2}[1-9][0-9]{6}$/,
                        'Email': /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
                        'CNIC': /^[0-9]{5}-[0-9]{7}-[0-9]{1}$/,
                        'CNIC1': /^\d{5}-?\d{7}-?\d{1}$/
                    };

                    if (df.validation && doc[df.fieldname]) {
                        var values = doc[df.fieldname];
                        // if (df.validation == 'Custom') {
                        //     validationTypes['Custom'] = new RegExp(df.regex.replace("//", "").replace("\/", ""));
                        //     // console.log("validationTypes", validationTypes);
                        // }
                        if (df.validation == 'Custom') {
                            // console.log('CUSTOM', df.regex.replace("\\/", "").replace("\/", "").replace("$/", "$"));
                            validationTypes['Custom'] = new RegExp(df.regex.replace("\\/", "").replace("\/", "").replace("$/", "$"));
                            // console.log("validationTypes", validationTypes);
                        }
                        if (validationTypes[df.validation]) {
                            var valid = validationTypes[df.validation].test(values);
                            if (!valid && values !== '') {
                                df.invalid = true;
                                if (df.reqd !== 1) {
                                    df.reqds = 1;
                                }
                                has_errors = true;
                                var labelmessage = df.label;
                                if (df.throw_error == 1 && df.error_message != '') {
                                    labelmessage += ' (' + df.error_message + ')';
                                }
                                invalidfields.push(__(labelmessage));
                                // if (!frm.scroll_set) {
                                //     scroll_to(doc.parentfield || df.fieldname);
                                // }

                            } else if (valid) {
                                df.invalid = false;
                                if (df.reqds === 1) {
                                    df.reqds = 0;
                                }

                            }
                        } else if (df.validation == 'Date') {
                            var selectedDate = new Date(values);
                            var currentDate = new Date();
                            if (df.date_range == 'Past' && selectedDate > currentDate) {
                                df.invalid = true;
                                if (df.reqd !== 1) {
                                    df.reqds = 1;
                                }
                                has_errors = true;
                                var labelmessage = df.label;
                                if (df.throw_error == 1 && df.error_message != '') {
                                    labelmessage += ' (' + df.error_message + ')';
                                }
                                invalidfields.push(__(labelmessage));
                            } else if (df.date_range == 'Future' && selectedDate < currentDate) {
                                df.invalid = true;
                                if (df.reqd !== 1) {
                                    df.reqds = 1;
                                }
                                has_errors = true;
                                var labelmessage = df.label;
                                if (df.throw_error == 1 && df.error_message != '') {
                                    labelmessage += ' (' + df.error_message + ')';
                                }
                                invalidfields.push(__(labelmessage));
                            } else {
                                df.invalid = false;
                                if (df.reqds === 1) {
                                    df.reqds = 0;
                                }
                            }
                        }


                    }

                    if (
                        is_docfield_mandatory(doc, df) &&
                        !frappe.model.has_value(doc.doctype, doc.name, df.fieldname)
                    ) {
                        has_errors = true;
                        error_fields[error_fields.length] = __(df.label);


                        if (folded) {
                            me.layout.unfold();
                            folded = false;
                        }
                    }
                }
            }
        });

        if (me.is_new() && me.meta.autoname === "Prompt" && !me.doc.__newname) {
            has_errors = true;
            error_fields = [__("Name"), ...error_fields];
        }


    });
    if (error_fields.length || invalidfields.length) {
        // console.log('ERROR');
        let meta = frappe.get_meta(frm.doctype);
        if (meta.istable) {
            const table_field = frappe.meta.docfield_map[doc.parenttype][doc.parentfield];

            const table_label = __(
                table_field.label || frappe.unscrub(table_field.fieldname)
            ).bold();

            var message = __("Mandatory fields required in table {0}, Row {1}", [
                table_label,
                doc.idx,
            ]);
        } else {
            if (error_fields.length) {
                var message = __("<b>Mandatory fields required in {0}</b>", [__(doc.doctype)]);
            }
        }
        if (error_fields.length) {
            message = message + "<br><br><ul><li>" + error_fields.join("</li><li>") + "</ul>";
        }


        if (invalidfields.length > 0) {
            if (message) {
                message = message + "<br><b>Fields contains invalid value </b><br><ul><li>" + invalidfields.join("</li><li>") + "</ul>";
            } else {
                var message = __("<b>Fields contains invalid value  in {0}</b>", [__(doc.doctype)]);
                message = message + "<br><ul><li>" + invalidfields.join("</li><li>") + "</ul>";
            }

        }
        // if (frappe.msgprint.is_open) {
        //     frappe.msgprint.hide();
        // }
        frappe.msgprint({
            message: message,
            indicator: "red",
            title: __("Missing / Invalid Fields"),
        });
        $(btn).prop("disabled", false);


    }
    setTimeout(function () {
        invalidfields = [];
    }, 2000);


    const scroll_to = (fieldname) => {
        frm.scroll_to_field(fieldname);
        frm.scroll_set = true;
    };

    var _call = function (opts) {
        // opts = {
        // 	method: "some server method",
        // 	args: {args to be passed},
        // 	callback: callback,
        // 	btn: btn
        // }

        if (frappe.ui.form.is_saving) {
            // this is likely to happen if the user presses the shortcut cmd+s for a longer duration or uses double click
            // no need to show this to user, as they can see "Saving" in freeze message
            // console.log("Already saving. Please wait a few moments.")
            throw "saving";
        }

        // ensure we remove new docs routes ONLY
        if (frm.is_new()) {
            frappe.ui.form.remove_old_form_route();
        }
        frappe.ui.form.is_saving = true;

        return frappe.call({
            freeze: true,
            // freeze_message: opts.freeze_message,
            method: opts.method,
            args: opts.args,
            btn: opts.btn,
            callback: function (r) {
                opts.callback && opts.callback(r);
            },
            error: opts.error,
            always: function (r) {
                $(btn).prop("disabled", false);
                frappe.ui.form.is_saving = false;

                if (r) {
                    var doc = r.docs && r.docs[0];
                    if (doc) {
                        frappe.ui.form.update_calling_link(doc);
                    }
                }
            }
        })
    };
    if (!has_errors) {
        if (action === "cancel") {
            cancel();
        } else {
            save();
        }
    }
}
