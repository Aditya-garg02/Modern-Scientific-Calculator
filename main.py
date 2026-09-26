import tkinter as tk
from tkinter import messagebox

from calculator import Calculator
from history import History


class CalculatorGUI:

    def __init__(self, root):

        self.root = root

        self.root.title(
            "Modern Scientific Calculator"
        )

        self.root.geometry(
            "620x850"
        )

        self.root.resizable(
            False,
            False
        )

        # -----------------------------------------------------
        # OBJECTS
        # -----------------------------------------------------

        self.calculator = Calculator()
        self.history = History()

        # Calculator memory
        self.memory = 0

        # -----------------------------------------------------
        # THEME
        # -----------------------------------------------------

        self.dark_mode = True

        self.dark_colors = {
            "background": "#171717",
            "display": "#242424",
            "text": "#FFFFFF",
            "button": "#2D2D2D",
            "operator": "#3A3A3A",
            "scientific": "#353535",
            "equal": "#4CAF50",
            "clear": "#D9534F",
            "history": "#444444"
        }

        self.light_colors = {
            "background": "#F2F2F2",
            "display": "#FFFFFF",
            "text": "#111111",
            "button": "#FFFFFF",
            "operator": "#E0E0E0",
            "scientific": "#D8D8D8",
            "equal": "#4CAF50",
            "clear": "#D9534F",
            "history": "#CCCCCC"
        }

        # -----------------------------------------------------
        # CREATE GUI
        # -----------------------------------------------------

        self.create_title()

        self.create_display()

        self.create_buttons()

        self.create_bottom_buttons()

        self.apply_theme()

        # Keyboard support
        self.root.bind(
            "<Key>",
            self.keyboard_input
        )

    # =========================================================
    # TITLE
    # =========================================================

    def create_title(self):

        self.title_label = tk.Label(
            self.root,
            text="🧮  SCIENTIFIC CALCULATOR",
            font=("Arial", 20, "bold")
        )

        self.title_label.pack(
            pady=(20, 10)
        )

    # =========================================================
    # DISPLAY
    # =========================================================

    def create_display(self):

        display_frame = tk.Frame(
            self.root
        )

        display_frame.pack(
            padx=25,
            pady=10,
            fill="x"
        )

        self.display = tk.Entry(
            display_frame,
            font=("Arial", 27),
            justify="right",
            bd=0,
            relief="flat"
        )

        self.display.pack(
            fill="x",
            ipady=20,
            padx=10,
            pady=10
        )

    # =========================================================
    # BUTTONS
    # =========================================================

    def create_buttons(self):

        self.button_frame = tk.Frame(
            self.root
        )

        self.button_frame.pack(
            padx=20,
            pady=10
        )

        buttons = [

            ["MC", "MR", "M+", "M-", "sin", "cos"],

            ["tan", "√", "log", "ln", "π", "e"],

            ["7", "8", "9", "÷", "%", "⌫"],

            ["4", "5", "6", "×", "x²", "^"],

            ["1", "2", "3", "−", "+", "("],

            ["0", ".", ")", "=", "", ""]
        ]

        for row in buttons:

            row_frame = tk.Frame(
                self.button_frame
            )

            row_frame.pack()

            for text in row:

                # Empty spaces
                if text == "":

                    empty_label = tk.Label(
                        row_frame,
                        width=7,
                        height=2
                    )

                    empty_label.pack(
                        side="left",
                        padx=4,
                        pady=4
                    )

                    continue

                button = tk.Button(
                    row_frame,
                    text=text,
                    width=7,
                    height=2,
                    font=("Arial", 13, "bold"),
                    bd=0,
                    relief="flat",
                    command=lambda value=text:
                    self.button_clicked(value)
                )

                button.pack(
                    side="left",
                    padx=4,
                    pady=4
                )

    # =========================================================
    # BOTTOM BUTTONS
    # =========================================================

    def create_bottom_buttons(self):

        bottom_frame = tk.Frame(
            self.root
        )

        bottom_frame.pack(
            pady=15
        )

        # AC
        self.clear_button = tk.Button(
            bottom_frame,
            text="AC",
            width=12,
            height=2,
            font=("Arial", 13, "bold"),
            bd=0,
            command=self.clear
        )

        self.clear_button.pack(
            side="left",
            padx=5
        )

        # CE
        self.ce_button = tk.Button(
            bottom_frame,
            text="CE",
            width=12,
            height=2,
            font=("Arial", 13, "bold"),
            bd=0,
            command=self.clear
        )

        self.ce_button.pack(
            side="left",
            padx=5
        )

        # +/- 
        self.sign_button = tk.Button(
            bottom_frame,
            text="±",
            width=12,
            height=2,
            font=("Arial", 13, "bold"),
            bd=0,
            command=self.toggle_sign
        )

        self.sign_button.pack(
            side="left",
            padx=5
        )

        # History
        self.history_button = tk.Button(
            bottom_frame,
            text="📜 History",
            width=12,
            height=2,
            font=("Arial", 13, "bold"),
            bd=0,
            command=self.show_history
        )

        self.history_button.pack(
            side="left",
            padx=5
        )

        # Theme
        self.theme_button = tk.Button(
            self.root,
            text="☀️ Light Mode",
            width=18,
            height=2,
            font=("Arial", 12, "bold"),
            bd=0,
            command=self.toggle_theme
        )

        self.theme_button.pack(
            pady=(0, 15)
        )

    # =========================================================
    # BUTTON HANDLER
    # =========================================================

    def button_clicked(self, value):

        # Clear
        if value == "AC":

            self.clear()

        # Backspace
        elif value == "⌫":

            self.backspace()

        # Equals
        elif value == "=":

            self.calculate()

        # Percentage
        elif value == "%":

            self.percentage()

        # Memory Clear
        elif value == "MC":

            self.memory_clear()

        # Memory Recall
        elif value == "MR":

            self.memory_recall()

        # Memory Add
        elif value == "M+":

            self.memory_add()

        # Memory Subtract
        elif value == "M-":

            self.memory_subtract()

        # Scientific functions
        elif value == "sin":

            self.add_to_display("sin(")

        elif value == "cos":

            self.add_to_display("cos(")

        elif value == "tan":

            self.add_to_display("tan(")

        elif value == "√":

            self.add_to_display("sqrt(")

        elif value == "log":

            self.add_to_display("log(")

        elif value == "ln":

            self.add_to_display("ln(")

        # Constants
        elif value == "π":

            self.add_to_display("pi")

        elif value == "e":

            self.add_to_display("e")

        # Power
        elif value == "^":

            self.add_to_display("^")

        # Square
        elif value == "x²":

            self.add_to_display("^2")

        # Operators
        elif value == "÷":

            self.add_to_display("/")

        elif value == "×":

            self.add_to_display("*")

        elif value == "−":

            self.add_to_display("-")

        # Everything else
        else:

            self.add_to_display(value)

    # =========================================================
    # ADD TO DISPLAY
    # =========================================================

    def add_to_display(self, value):

        self.display.insert(
            tk.END,
            value
        )

        self.display.focus_set()

    # =========================================================
    # CLEAR
    # =========================================================

    def clear(self):

        self.display.delete(
            0,
            tk.END
        )

        self.display.focus_set()

    # =========================================================
    # BACKSPACE
    # =========================================================

    def backspace(self):

        current = self.display.get()

        if current:

            self.display.delete(
                len(current) - 1,
                tk.END
            )

        self.display.focus_set()

    # =========================================================
    # CALCULATE
    # =========================================================

    def calculate(self):

        expression = self.display.get()

        if not expression:
            return

        try:

            result = self.calculator.evaluate(
                expression
            )

            result = self.format_result(
                result
            )

            # Save history
            self.history.add(
                expression,
                result
            )

            self.display.delete(
                0,
                tk.END
            )

            self.display.insert(
                0,
                result
            )

            self.display.focus_set()

        except ValueError as error:

            messagebox.showerror(
                "Calculation Error",
                str(error)
            )

    # =========================================================
    # PERCENTAGE
    # =========================================================

    def percentage(self):

        value = self.display.get()

        if not value:
            return

        try:

            number = float(value)

            result = number / 100

            result = self.format_result(
                result
            )

            self.history.add(
                f"{number}%",
                result
            )

            self.display.delete(
                0,
                tk.END
            )

            self.display.insert(
                0,
                result
            )

            self.display.focus_set()

        except ValueError:

            messagebox.showerror(
                "Error",
                "Please enter a valid number."
            )

    # =========================================================
    # TOGGLE SIGN
    # =========================================================

    def toggle_sign(self):

        value = self.display.get()

        if not value:
            return

        try:

            number = float(value)

            number = -number

            result = self.format_result(
                number
            )

            self.display.delete(
                0,
                tk.END
            )

            self.display.insert(
                0,
                result
            )

        except ValueError:

            messagebox.showerror(
                "Error",
                "Enter a number before using ±."
            )

    # =========================================================
    # MEMORY CLEAR
    # =========================================================

    def memory_clear(self):

        self.memory = 0

    # =========================================================
    # MEMORY RECALL
    # =========================================================

    def memory_recall(self):

        self.display.delete(
            0,
            tk.END
        )

        self.display.insert(
            0,
            self.format_result(
                self.memory
            )
        )

        self.display.focus_set()

    # =========================================================
    # MEMORY ADD
    # =========================================================

    def memory_add(self):

        try:

            value = float(
                self.display.get()
            )

            self.memory += value

        except ValueError:

            messagebox.showerror(
                "Memory Error",
                "Enter a valid number."
            )

    # =========================================================
    # MEMORY SUBTRACT
    # =========================================================

    def memory_subtract(self):

        try:

            value = float(
                self.display.get()
            )

            self.memory -= value

        except ValueError:

            messagebox.showerror(
                "Memory Error",
                "Enter a valid number."
            )

    # =========================================================
    # HISTORY WINDOW
    # =========================================================

    def show_history(self):

        window = tk.Toplevel(
            self.root
        )

        window.title(
            "Calculation History"
        )

        window.geometry(
            "500x560"
        )

        window.resizable(
            False,
            False
        )

        window.config(
            bg=self.get_colors()["background"]
        )

        # Title
        title = tk.Label(
            window,
            text="📜 Calculation History",
            font=("Arial", 20, "bold"),
            bg=self.get_colors()["background"],
            fg=self.get_colors()["text"]
        )

        title.pack(
            pady=15
        )

        # History list
        history_box = tk.Listbox(
            window,
            font=("Arial", 13),
            width=43,
            height=20,
            bd=0,
            relief="flat",
            bg=self.get_colors()["display"],
            fg=self.get_colors()["text"]
        )

        history_box.pack(
            padx=20,
            pady=10
        )

        records = self.history.get_history()

        if records:

            for record in records:

                expression = record["expression"]

                result = record["result"]

                history_box.insert(
                    tk.END,
                    f"{expression} = {result}"
                )

        else:

            history_box.insert(
                tk.END,
                "No calculations yet."
            )

        # Clear history button
        clear_history_button = tk.Button(
            window,
            text="Clear History",
            font=("Arial", 12, "bold"),
            width=18,
            command=lambda:
            self.clear_history(
                history_box
            )
        )

        clear_history_button.pack(
            pady=10
        )

        clear_history_button.config(
            bg=self.get_colors()["clear"],
            fg="white"
        )

    # =========================================================
    # CLEAR HISTORY
    # =========================================================

    def clear_history(self, history_box):

        self.history.clear_history()

        history_box.delete(
            0,
            tk.END
        )

        history_box.insert(
            tk.END,
            "No calculations yet."
        )

    # =========================================================
    # THEME
    # =========================================================

    def toggle_theme(self):

        self.dark_mode = not self.dark_mode

        self.apply_theme()

    # =========================================================
    # GET CURRENT COLORS
    # =========================================================

    def get_colors(self):

        if self.dark_mode:

            return self.dark_colors

        return self.light_colors

    # =========================================================
    # APPLY THEME
    # =========================================================

    def apply_theme(self):

        colors = self.get_colors()

        # Main window
        self.root.config(
            bg=colors["background"]
        )

        # Title
        self.title_label.config(
            bg=colors["background"],
            fg=colors["text"]
        )

        # Display
        self.display.config(
            bg=colors["display"],
            fg=colors["text"],
            insertbackground=colors["text"]
        )

        # Buttons
        self.update_buttons(
            self.button_frame,
            colors
        )

        # Bottom buttons
        self.clear_button.config(
            bg=colors["clear"],
            fg="white",
            activebackground=colors["clear"],
            activeforeground="white"
        )

        self.ce_button.config(
            bg=colors["operator"],
            fg=colors["text"],
            activebackground=colors["operator"],
            activeforeground=colors["text"]
        )

        self.sign_button.config(
            bg=colors["operator"],
            fg=colors["text"],
            activebackground=colors["operator"],
            activeforeground=colors["text"]
        )

        self.history_button.config(
            bg=colors["history"],
            fg=colors["text"],
            activebackground=colors["history"],
            activeforeground=colors["text"]
        )

        # Theme button
        if self.dark_mode:

            self.theme_button.config(
                text="☀️ Light Mode"
            )

        else:

            self.theme_button.config(
                text="🌙 Dark Mode"
            )

        self.theme_button.config(
            bg=colors["operator"],
            fg=colors["text"],
            activebackground=colors["operator"],
            activeforeground=colors["text"]
        )

    # =========================================================
    # UPDATE BUTTON COLORS
    # =========================================================

    def update_buttons(
        self,
        parent,
        colors
    ):

        for child in parent.winfo_children():

            if isinstance(
                child,
                tk.Frame
            ):

                self.update_buttons(
                    child,
                    colors
                )

            elif isinstance(
                child,
                tk.Button
            ):

                text = child.cget(
                    "text"
                )

                # Equal button
                if text == "=":

                    bg = colors["equal"]
                    fg = "white"

                # Scientific buttons
                elif text in [
                    "MC",
                    "MR",
                    "M+",
                    "M-",
                    "sin",
                    "cos",
                    "tan",
                    "√",
                    "log",
                    "ln",
                    "π",
                    "e"
                ]:

                    bg = colors["scientific"]
                    fg = colors["text"]

                # Operators
                elif text in [
                    "÷",
                    "×",
                    "−",
                    "+",
                    "^",
                    "%",
                    "x²",
                    "⌫"
                ]:

                    bg = colors["operator"]
                    fg = colors["text"]

                # Normal numbers
                else:

                    bg = colors["button"]
                    fg = colors["text"]

                child.config(
                    bg=bg,
                    fg=fg,
                    activebackground=bg,
                    activeforeground=fg
                )

    # =========================================================
    # KEYBOARD INPUT
    # =========================================================

    def keyboard_input(self, event):

        key = event.char

        # Numbers
        if key.isdigit():

            self.add_to_display(key)

        # Operators
        elif key in ".+-*/()%":

            self.add_to_display(key)

        # Power
        elif key == "^":

            self.add_to_display("^")

        # Enter
        elif event.keysym == "Return":

            self.calculate()

        # Backspace
        elif event.keysym == "BackSpace":

            self.backspace()

        # Escape
        elif event.keysym == "Escape":

            self.clear()

    # =========================================================
    # FORMAT RESULT
    # =========================================================

    def format_result(self, result):

        if isinstance(
            result,
            float
        ):

            if result.is_integer():

                return str(
                    int(result)
                )

            return str(
                round(result, 10)
            )

        return str(result)


# =============================================================
# START APPLICATION
# =============================================================

if __name__ == "__main__":

    root = tk.Tk()

    app = CalculatorGUI(
        root
    )

    root.mainloop()