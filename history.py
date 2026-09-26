import json
import os


class History:

    def __init__(self, filename="history.json"):
        self.filename = filename
        self.records = []
        self.load_history()

    # ---------------------------------------------------------
    # ADD RECORD
    # ---------------------------------------------------------

    def add(self, expression, result):

        self.records.append({
            "expression": expression,
            "result": result
        })

        self.save_history()

    # ---------------------------------------------------------
    # GET HISTORY
    # ---------------------------------------------------------

    def get_history(self):
        return self.records

    # ---------------------------------------------------------
    # SAVE HISTORY
    # ---------------------------------------------------------

    def save_history(self):

        try:

            with open(
                self.filename,
                "w",
                encoding="utf-8"
            ) as file:

                json.dump(
                    self.records,
                    file,
                    indent=4
                )

        except OSError:

            pass

    # ---------------------------------------------------------
    # LOAD HISTORY
    # ---------------------------------------------------------

    def load_history(self):

        if not os.path.exists(self.filename):
            return

        try:

            with open(
                self.filename,
                "r",
                encoding="utf-8"
            ) as file:

                self.records = json.load(file)

        except (
            OSError,
            json.JSONDecodeError
        ):

            self.records = []

    # ---------------------------------------------------------
    # CLEAR HISTORY
    # ---------------------------------------------------------

    def clear_history(self):

        self.records.clear()

        self.save_history()