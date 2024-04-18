import frappe
from frappe import _ 

 

def after_install(): 
    #from frappe.model.document import Document

    doc_type = "DocField"

    # Add field to the DocType
    fields = [{
                "depends_on": "",
                "description": "",
                "fieldname": "validation",
                "fieldtype": "Select",
                "label": "Validation",
                "insert_after": "options",
                "options": "\nPhone\nMobile\nEmail\nURL\nName\nCNIC\nDate\nIBAN\nINT\nFLOAT\nCustom",
                "parent": "DocType",
                "mandatory_depends_on": "",
                "doctype": "DocField",
                "parentfield": "fields",
                "parenttype": "DocType"
            },
            {
                "depends_on": "eval:doc.validation==\"Date\"",
                "description": "",
                "fieldname": "date_range",
                "fieldtype": "Select",
                "label": "Date Range",
                "insert_after": "validation", 
                "options": "\nPast\nFuture",
                "mandatory_depends_on": "",
                "parent": "DocType",
                 "doctype": "DocField",
                "parentfield": "fields",
                "parenttype": "DocType"
            },
            
            {
                "depends_on": "eval:doc.validation==\"Custom\"",
                "description": "",
                "fieldname": "regex",
                "fieldtype": "Data",
                "insert_after": "date_range", 
                "label": "Regex",
                "mandatory_depends_on": "",
                "parent": "DocType",
                 "doctype": "DocField",
                "parentfield": "fields",
                "parenttype": "DocType"
            },
            {
                "depends_on": "",
                "description": "",
                "default": "0",
                "fieldname": "masking",
                "fieldtype": "Check",
                "insert_after": "regex", 
                "label": "Masking",
                "mandatory_depends_on": "",
                "parent": "DocType",
                 "doctype": "DocField",
                "parentfield": "fields",
                "parenttype": "DocType"
            },
            {
                "depends_on": "eval: doc.masking == 1",
                "description": "Example:  <br>\nFor CNIC ---&gt;  99999-9999999-9<br>\nFor DDO Code ---&gt; AA.9999<br><br>\nDefault masking definitions.<br>\n9: numeric<br>\na: alphabetical<br>\n*: alphanumeric<br><br>\nIf you need more information please visit link below:<br>\n<a href=\"https://codepen.io/Haroon-Abbas/pen/bGQNmrG\" target=\"_blank\">Click Here</a>",
                "fieldname": "masking_format",
                "fieldtype": "Data",
                "label": "Masking Format",
                "insert_after": "masking_format", 
                "mandatory_depends_on": "eval: doc.masking == 1",
                "parent": "DocType",
                "doctype": "DocField",
                "parentfield": "fields",
                "parenttype": "DocType"
            },
            {
                "depends_on": "",
                "description": "",
                "fieldname": "throw_error",
                "fieldtype": "Check",
                "label": "Throw Error",
                "insert_after": "masking_format", 
                "mandatory_depends_on": "",
                "parent": "DocType",
                "doctype": "DocField",
                "parentfield": "fields",
                "parenttype": "DocType"
            },
            {
                "depends_on": "eval: doc.throw_error == 1",
                "description": "",
                "fieldname": "error_message",
                "fieldtype": "Data",
                "label": "Error Message",
                "insert_after": "throw_error", 
                "mandatory_depends_on": "",
                "parent": "DocType",
                "doctype": "DocField",
                "parentfield": "fields",
                "parenttype": "DocType"
            }
    ]

    for xfield in fields: 
        field = frappe.new_doc("DocField")
        field.label = xfield["label"]  
        field.fieldname = xfield["fieldname"] 
        field.fieldtype = xfield["fieldtype"] 
        field.options = xfield.get("options", "") 
        field.description = xfield["description"] #xfield.get("description", "")
        field.depends_on = xfield["depends_on"] #xfield.get("depends_on", "") 
        field.mandatory_depends_on = xfield["mandatory_depends_on"]  #xfield.get("mandatory_depends_on", "") 
        field.insert_after = xfield["insert_after"] 
        field.parent = doc_type 
        field.parentfield = xfield["parentfield"] 
        field.parenttype = xfield["parenttype"] 
        field.insert(ignore_permissions=True)

 
    # Clear DocType cache
    frappe.clear_cache(doctype=doc_type)
 