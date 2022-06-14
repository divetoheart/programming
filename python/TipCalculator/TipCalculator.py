print("Welcome to the Tip Calculator\n")
bill = input("Enter the total bill: \n$")
bill = float(bill)
people = input("Enter the amount of people to split the bill: \n")
people = float(people)
percent = input("What percentage would you like to tip? \n")
percent = float(percent)
if percent > 1:
    percent /= 100 #convert to decimal form
else: 
    percent = percent #is already in decimal form
bill_after_tip = bill * percent + bill
answer = round(bill_after_tip / people, 2)
print(f"Total bill: ${bill_after_tip}")
input(f"Total split: ${answer}\n")