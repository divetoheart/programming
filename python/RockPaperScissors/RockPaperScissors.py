import random

print("Welcome to Rock Paper Scissors!")
print("May the odds be ever in your favor...")
options = ["rock", "paper", "scissors"]
playerMove = input("Type 'rock', 'paper', or 'scissors'! \n").lower()
pcMove = random.randint(0, 2)
pcMove = options[pcMove]

win = "You won!"
draw = "Draw!"
lose = "You lose!"

print(f"Computer chose {pcMove}.")

if playerMove == options[0]:
    if pcMove == options[2]:
        print(win)
    elif pcMove == options[1]:
        print(lose)
    else:
        print(draw)
elif playerMove == options[1]:
    if pcMove == options[2]:
        print(lose)
    elif pcMove == options[0]:
        print(win)
    else:
        print(draw)
elif playerMove == options[2]:
    if pcMove == options[0]:
        print(lose)
    elif pcMove == options[1]:
        print(win)
    else:
        print(draw)