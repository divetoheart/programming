row1 = [" ", " ", " "]
row2 = [" ", " ", " "]
row3 = [" ", " ", " "]
map = [row1, row2, row3]
print(f"{row1}\n{row2}\n{row3}")
position = input("Where do you want to bury your treasure? Use 'x y' coordinates. \n")
position = position.split(" ")
x = int(position[0])
y = int(position[1])
map[y-1][x-1] = "X"
print(f"{row1}\n{row2}\n{row3}")