nums = input("Enter a series of numbers separated by a space. \n").split(" ")
print(nums)

total = 0
for num in nums:
    total += float(num)
print(total/len(nums))