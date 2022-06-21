print("Welcome to the Python Base Calculator.")
print("Convert any number of any base into any other base.")
num = input("Enter a number and it's base, separated by a space.\n(e.g. '123 10')\n").split(" ")
base = int(num[1])
num = int(num[0])
new_base = int(input("Now enter the base to convert to. \n"))

digits = [int(i) for i in str(num)]
for x in digits:
    if x >= base:
        print(f"Inputted number is not valid in base {base}.")
        quit()
    else:
        pass

d = len(digits) - 1
b = 0
dec_value = 0
while d <= len(digits)-1 and d >= 0:
    dec_value = dec_value + (digits[d] * ((base) ** b))
    d = d - 1
    b = b + 1

print(dec_value)