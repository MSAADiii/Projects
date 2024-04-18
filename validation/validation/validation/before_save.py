import frappe
import re
import datetime


def validate(doc, event):
    error_report = []
    if doc.doctype and doc.docstatus != 0:
        # sql = """SELECT count(*) as total
        #     FROM information_schema.columns
        #     WHERE table_name = 'tab%s'
        #     AND column_name = 'validation'
        # """ % (doc.doctype)
        # result = frappe.db.sql(sql, as_dict=True)
        # if result:
        #     record = result[0].get('total')
        #     if record > 0:
        doc_fields = frappe.db.sql(
            """
            SELECT
                label,
                fieldname,
                reqd,
                validation,
                regex,
                error_message,
                date_range,
                hidden
            FROM
                `tabDocField`
            WHERE
                parent = %s AND parenttype = 'DocType' AND (reqd = 1 OR validation != '') AND hidden = 0
        """,
            (doc.doctype),
            as_dict=1,
        )

        validationTypes = {
            "Name": "^[a-zA-Z\s._-]+$",
            "INT": "^[0-9]+$",
            "PASSPORT": "^[A-Z]{2}\d{7}[A-Z]{0,1}$",
            "FLOAT": "^[+-]?\d+(\.\d+)?$",
            "IBAN": "^[A-Z]{2}\d{2}[A-Z\d]{1,30}$",
            "URL": "^(https?|ftp):\/\/([A-Z0-9]+([A-Z0-9-]*[A-Z0-9]+)*\.)+[A-Z]{2,7}(:[0-9]+)?(\/.*)?$",
            "Mobile": "^(03[0-9]{2}[\-][0-9]{7})$",
            "Phone": "^(?:\+92|0)?[1-9][0-9]{1,2}[1-9][0-9]{6}$",
            "Email": "^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$",
            "CNIC": "^[0-9]{5}-[0-9]{7}-[0-9]{1}$",
            "CNIC1": "^\d{5}-?\d{7}-?\d{1}$",
        }
        error_report.append("<b>Fields contains invalid values</b> <br />")
        for field in doc_fields:
            if not vars(doc)[field["fieldname"]] and field["reqd"]:
                error_report.append(field["label"])

            if (
                vars(doc)[field["fieldname"]]
                and field["validation"]
                and field["validation"] == "date"
            ):
                current_date = datetime.date.today()
                text = vars(doc)[field["fieldname"]]
                if field["date_range"] == "Past" and text > current_date:
                    error_report.append(field["label"])
                elif field["date_range"] == "Future" and text < current_date:
                    error_report.append(field["label"])
            elif (
                vars(doc)[field["fieldname"]]
                and field["validation"]
                and field["validation"] != "Custom"
            ):
                for key, pattern in validationTypes.items():
                    if key == field["validation"]:
                        text = vars(doc)[field["fieldname"]]
                        if not re.match(pattern, text):
                            error_report.append(field["label"])
            elif (
                vars(doc)[field["fieldname"]]
                and field["validation"]
                and field["validation"] == "Custom"
            ):
                text = vars(doc)[field["fieldname"]]
                pattern = field["regex"]

                # print("************REG***************")
                # print(field["label"])
                # print(pattern)
                # print(field["fieldname"])
                # print(text)

                if field["fieldname"] == "establishment_year":
                    if not re.match(pattern, str(text)):
                        error_report.append(field["label"])
                else:
                    if not re.match(pattern, text):
                        error_report.append(field["label"])
                

        if len(error_report) > 1:
            frappe.throw(
                '<br />  <span class="indicator grey"></span>'.join(error_report)
            )
