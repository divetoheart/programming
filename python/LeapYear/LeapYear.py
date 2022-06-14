print("This program tells you if a given year is a Leap Year. \n")
year = input("Enter a year: \n")
isTrue = f"{year} is a Leap Year."
isFalse = f"{year} is not a Leap Year."
if int(year)%4 == 0:                        #2020 % 4 = 0;          
    if int(year)%100 != 0:                  #2020 % 100 != 0;
        print(isTrue)                       #2020 is a Leap Year
    else:
        if int(year)%400 == 0:
            print(isTrue)
        else:
            print(isFalse)
else: 
    print(isFalse)