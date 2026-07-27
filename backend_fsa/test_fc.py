from vnstock import Vnstock
from financials import FinancialData

financial = FinancialData("FPT")
data = financial.get_all()

print("\nIncome Statement Items:")
print(data["income_statement"].index.tolist())

print("\nCash Flow Items:")
print(data["cash_flow"].index.tolist())