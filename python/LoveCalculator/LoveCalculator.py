print("Welcome to the Love Calculator!")
name1 = input("What is your name? \n").lower()
name2 = input("WHat is your partner's name? \n").lower()
combineName = name1 + name2

score10s = combineName.count("t") + combineName.count("r") + combineName.count("u") + combineName.count("e")
score1s = combineName.count("l") + combineName.count("o") + combineName.count("v") + combineName.count("e")
score = str(score10s) + str(score1s)

if int(score) < 10 or int(score) > 90:
    input(f"Your love compabilitity is {score}%. You are extremely compatible!")
elif int(score) > 50:
    input(f"Your score is {score}%. You are fairly compatible.")
else:
    input(f"Your score is {score}%.")


#TEST CASE
#JUSTINVALERIE
#0101000001101 = 5 FOR TRUE
#0000001011001 = 4 FOR FALSE