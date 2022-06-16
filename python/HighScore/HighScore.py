scores = input("Input a list of all scores separated by a space. \n").split(" ")
highscore = 0
for score in scores:
    score = int(score)
    if score > highscore:
        highscore = score
    else: 
        pass
print(highscore)
