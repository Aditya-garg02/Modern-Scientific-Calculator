import ast
import math
import operator


class Calculator:

    def __init__(self):

        self.binary_operators = {
            ast.Add: operator.add,
            ast.Sub: operator.sub,
            ast.Mult: operator.mul,
            ast.Div: operator.truediv,
            ast.Mod: operator.mod,
            ast.Pow: operator.pow
        }

        self.unary_operators = {
            ast.UAdd: operator.pos,
            ast.USub: operator.neg
        }

        self.functions = {
            "sin": lambda x: math.sin(math.radians(x)),
            "cos": lambda x: math.cos(math.radians(x)),
            "tan": lambda x: math.tan(math.radians(x)),
            "sqrt": math.sqrt,
            "log": math.log10,
            "ln": math.log,
            "abs": abs,
            "percent": lambda x: x / 100
        }

        self.constants = {
            "pi": math.pi,
            "e": math.e
        }

    # =========================================================
    # MAIN EVALUATOR
    # =========================================================

    def evaluate(self, expression):

        expression = expression.replace("×", "*")
        expression = expression.replace("÷", "/")
        expression = expression.replace("−", "-")
        expression = expression.replace("^", "**")

        if not expression.strip():
            raise ValueError(
                "Please enter an expression."
            )

        try:

            tree = ast.parse(
                expression,
                mode="eval"
            )

            return self._evaluate_node(
                tree.body
            )

        except ZeroDivisionError:

            raise ValueError(
                "Cannot divide by zero."
            )

        except SyntaxError:

            raise ValueError(
                "Invalid expression."
            )

        except (ValueError, OverflowError):

            raise ValueError(
                "Invalid calculation."
            )

    # =========================================================
    # AST EVALUATION
    # =========================================================

    def _evaluate_node(self, node):

        # -----------------------------------------------------
        # NUMBERS
        # -----------------------------------------------------

        if isinstance(node, ast.Constant):

            if (
                isinstance(node.value, (int, float))
                and not isinstance(node.value, bool)
            ):

                return node.value

            raise ValueError(
                "Invalid number."
            )

        # -----------------------------------------------------
        # BINARY OPERATIONS
        # -----------------------------------------------------

        if isinstance(node, ast.BinOp):

            operation = self.binary_operators.get(
                type(node.op)
            )

            if operation is None:

                raise ValueError(
                    "Operator not supported."
                )

            left = self._evaluate_node(
                node.left
            )

            right = self._evaluate_node(
                node.right
            )

            if (
                isinstance(node.op, ast.Pow)
                and abs(right) > 1000
            ):

                raise ValueError(
                    "Exponent is too large."
                )

            return operation(
                left,
                right
            )

        # -----------------------------------------------------
        # +NUMBER / -NUMBER
        # -----------------------------------------------------

        if isinstance(node, ast.UnaryOp):

            operation = self.unary_operators.get(
                type(node.op)
            )

            if operation is None:

                raise ValueError(
                    "Operator not supported."
                )

            return operation(
                self._evaluate_node(
                    node.operand
                )
            )

        # -----------------------------------------------------
        # PI / E
        # -----------------------------------------------------

        if isinstance(node, ast.Name):

            if node.id in self.constants:

                return self.constants[node.id]

            raise ValueError(
                f"Unknown value: {node.id}"
            )

        # -----------------------------------------------------
        # FUNCTIONS
        # -----------------------------------------------------

        if isinstance(node, ast.Call):

            if not isinstance(
                node.func,
                ast.Name
            ):

                raise ValueError(
                    "Invalid function."
                )

            function = self.functions.get(
                node.func.id
            )

            if function is None:

                raise ValueError(
                    f"Unknown function: {node.func.id}"
                )

            if (
                len(node.args) != 1
                or node.keywords
            ):

                raise ValueError(
                    "Function requires one number."
                )

            return function(
                self._evaluate_node(
                    node.args[0]
                )
            )

        # -----------------------------------------------------
        # INVALID
        # -----------------------------------------------------

        raise ValueError(
            "Invalid expression."
        )