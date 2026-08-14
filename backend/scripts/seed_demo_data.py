#!/usr/bin/env python3
"""Load demo magazine content so the public site and admin are not empty."""

from __future__ import annotations

import io
import json
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.request import Request, urlopen

from PIL import Image, ImageDraw, ImageFont

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from app.database import SessionLocal, engine  # noqa: E402
from app.media_storage import (  # noqa: E402
    UPLOAD_DIR,
    build_public_path,
    create_thumbnail,
    ensure_upload_dir,
    thumb_filename_for,
)
from app.models import Blog, Category, Media, Subcategory, Tag  # noqa: E402
from app.utils.slugify import slugify  # noqa: E402

PUBLIC_API = "http://localhost:8000"

UNSPLASH = "https://images.unsplash.com/{photo}?auto=format&fit=crop&w=1400&q=80"

CATEGORIES = [
    {
        "name": "Culture",
        "slug": "culture",
        "description": "Essays, books, and the stories we keep returning to.",
        "status": "active",
        "subs": [
            ("Essays", "essays", "Longer thinking, written slowly."),
            ("Books", "books", "Reading notes and recommendations."),
            ("Film", "film", "Currently paused — a few archived notes remain."),
        ],
    },
    {
        "name": "Focus",
        "slug": "focus",
        "description": "Attention, habits, and the tools that actually help.",
        "status": "active",
        "subs": [
            ("Deep work", "deep-work", "Uninterrupted time and how to keep it."),
            ("Habits", "habits", "Small repeats that change a week."),
            ("Tools", "tools", "Desks, notebooks, and what I deleted."),
        ],
    },
    {
        "name": "Sport",
        "slug": "sport",
        "description": "Cricket, running, and training that fits a real week.",
        "status": "active",
        "subs": [
            ("Cricket", "cricket", "Nets, match days, and leaving the ball."),
            ("Running", "running", "Easy kilometres and coming back from injury."),
            ("Training", "training", "Short sessions, rest days, warm-ups."),
        ],
    },
    {
        "name": "Life",
        "slug": "life",
        "description": "Kitchen, travel, and the ordinary days in between.",
        "status": "active",
        "subs": [
            ("Notes", "notes", "Short observations from ordinary days."),
            ("Kitchen", "kitchen", "Meals for nights when cooking feels like work."),
            ("Travel", "travel", "Trains, small bags, and walking without a map."),
        ],
    },
]

DISABLED_SUBS = {"film"}

TAGS = [
    "beginner",
    "routine",
    "weekend",
    "review",
    "how-to",
    "opinion",
    "india",
    "practice",
    "slow-living",
    "match-day",
    "deep-work",
    "tools",
    "reading",
    "cricket",
    "running",
    "cooking",
    "travel",
    "habits",
    "rest",
    "field-notes",
]

PHOTOS = [
    "photo-1499750310107-5fefc47bd6d0",
    "photo-1486312338219-ce68d2ad6e43",
    "photo-1455390582262-044cdead277a",
    "photo-1512820790803-83ca734da794",
    "photo-1524995997940-a1c82f293e0b",
    "photo-1504674900247-0877df9cc836",
    "photo-1556910103-1c02745aae4d",
    "photo-1461896836934-ffe607ba6851",
    "photo-1476480862126-458bd7c7781c",
    "photo-1574629810360-7efbbe195018",
    "photo-1531415074968-336d3a8e3619",
    "photo-1469854523086-cc02fe5d8800",
    "photo-1500530855697-b586d89ba3ee",
    "photo-1489599849927-2ee91cede3ba",
    "photo-1516321318423-f06f85e504b3",
    "photo-1495474472287-4d71bcdd2085",
    "photo-1509042239860-f550ce710b93",
    "photo-1441974231531-c6227db76b6e",
    "photo-1478132854117-d8bb76e57042",
    "photo-1436491865332-7a61a109cc05",
    "photo-1517836357463-d25dfeac3438",
    "photo-1541625602330-2277a4c46182",
    "photo-1556909114-f6e7ad7d3136",
    "photo-1484480974693-6ca0ab361295",
]

POSTS = [
    ("The Case for Reading Slowly", "culture", "essays", "PUBLISHED",
     "Speed is a bad metric for books. Attention is the point.",
     ["reading", "slow-living", "opinion"],
     ["Read one chapter twice before going on.", "Keep a pencil in the book.", "Stop when the sentences start to blur."]),
    ("Why Small Cities Feel Bigger Now", "culture", "essays", "PUBLISHED",
     "A walkable centre, a good library, and fewer errands can feel like more life, not less.",
     ["opinion", "slow-living", "field-notes"],
     ["Errands take ten minutes, not an afternoon.", "You recognise the same faces.", "Weekends do not require a plan."]),
    ("On Keeping a Paper Diary in 2026", "culture", "essays", "PUBLISHED",
     "A cheap notebook still beats a notes app when you want to remember a day.",
     ["slow-living", "tools", "routine"],
     ["Date the page before you write.", "Three sentences is enough.", "Do not reread until the month ends."]),
    ("What Silence Sounds Like in a City", "culture", "essays", "PUBLISHED",
     "Silence is rarely empty. It is fans, distant trains, and the fridge clicking off.",
     ["field-notes", "opinion"],
     ["Early mornings on a balcony.", "Libraries after lunch.", "A park just after rain."]),
    ("Three Books I Keep Re-reading", "culture", "books", "PUBLISHED",
     "Not because they are perfect — because they still change the week I am in.",
     ["reading", "review", "slow-living"],
     ["A novel for weather and mood.", "A craft book when work feels thin.", "A slim essay collection for travel days."]),
    ("A Field Guide to Abandoned Bookshops", "culture", "books", "PUBLISHED",
     "The best shelves are the ones that still smell like paper and dust.",
     ["reading", "travel", "weekend"],
     ["Look for handwritten price tags.", "Buy the odd title, not the famous one.", "Ask what they would keep if they could only keep ten."]),
    ("Why I Finished Fewer Books This Year", "culture", "books", "PUBLISHED",
     "Finishing is not the same as reading. I stopped pretending otherwise.",
     ["reading", "opinion", "habits"],
     ["Quit by page forty if it is a slog.", "Reread instead of stacking new titles.", "One book in the bag, none on the nightstand queue."]),
    ("Notes in the Margins", "culture", "books", "PUBLISHED",
     "How I mark nonfiction so the ideas survive the commute home.",
     ["reading", "how-to", "tools"],
     ["Underline sparingly.", "Write a question, not a summary.", "Copy one sentence into the diary."]),
    ("A Quiet Desk Beats a New App", "focus", "tools", "PUBLISHED",
     "One notebook and a calendar still outperform a stack of productivity software.",
     ["tools", "deep-work", "opinion"],
     ["Write the three tasks for the day.", "Close the extra tabs before you start.", "Leave the phone in another room."]),
    ("Ninety Minutes, Then Stop", "focus", "deep-work", "PUBLISHED",
     "A timed block is more honest than an open-ended promise to 'work hard today'.",
     ["deep-work", "routine", "how-to"],
     ["Set a visible timer.", "No messages until it rings.", "Stand up immediately when it ends."]),
    ("How I Protect Mornings From Email", "focus", "deep-work", "PUBLISHED",
     "Inbox is other people's agenda. Mine starts after the first deep block.",
     ["deep-work", "habits", "routine"],
     ["Airplane mode until 10:30.", "Write before you reply.", "Batch mail twice, not all day."]),
    ("The Myth of Multitasking at Home", "focus", "deep-work", "PUBLISHED",
     "Two half-jobs feel busy and produce almost nothing you can point to.",
     ["deep-work", "opinion", "habits"],
     ["One tab, one task.", "Kitchen after work, not during it.", "If it needs thought, it needs a closed door."]),
    ("Why I Stopped Tracking Every Habit", "focus", "habits", "DRAFT",
     "Streaks started running the week. I wanted the habits, not the scoreboard.",
     ["habits", "opinion", "slow-living"],
     ["Keep the habit, drop the spreadsheet.", "Miss a day without a confession essay.", "Review monthly, not hourly."]),
    ("One Habit, Four Weeks", "focus", "habits", "PUBLISHED",
     "Stacking ten new routines in January is how none of them survive February.",
     ["habits", "beginner", "routine"],
     ["Pick one habit only.", "Make it smaller than you think.", "Do not add a second until week five."]),
    ("The 8pm Shutdown Ritual", "focus", "habits", "PUBLISHED",
     "Work ends when the notebook closes, not when the laptop lid happens to shut.",
     ["habits", "routine", "deep-work"],
     ["Write tomorrow's first task.", "Plug the laptop in another room.", "Kettle on. That is the bell."]),
    ("Building a Habit Without an App", "focus", "habits", "PUBLISHED",
     "A paper tick-box on the fridge is still the most reliable tracker I have used.",
     ["habits", "tools", "beginner"],
     ["Put the cue where you already stand.", "Same time beats perfect time.", "Celebrate with rest, not a new system."]),
    ("My Entire Writing Setup Fits in a Backpack", "focus", "tools", "PUBLISHED",
     "Laptop, charger, notebook, pen. If it does not fit, it does not come.",
     ["tools", "travel", "deep-work"],
     ["One notebook for drafts.", "Offline docs for trains.", "No extra dongles 'just in case'."]),
    ("Analog Tools I Still Use", "focus", "tools", "PUBLISHED",
     "Paper, a cheap timer, and a wall calendar — still faster than most dashboards.",
     ["tools", "slow-living", "opinion"],
     ["Wall calendar for the month.", "Kitchen timer for sprints.", "Index cards for stubborn problems."]),
    ("What I Deleted From My Phone", "focus", "tools", "PUBLISHED",
     "The home screen got quieter. So did the evenings.",
     ["tools", "habits", "opinion"],
     ["Social apps off the first screen.", "No news apps.", "Mail checked at a desk, not in bed."]),
    ("A Calendar, Not a Second Brain", "focus", "tools", "PUBLISHED",
     "If it has a time, it goes on the calendar. Everything else can wait in a list.",
     ["tools", "how-to", "routine"],
     ["Meetings and deep blocks only.", "Tasks live in one list.", "No tagging taxonomy to maintain."]),
    ("How to Improve Cricket Batting", "sport", "cricket", "PUBLISHED",
     "Simple net drills you can do in 30 minutes without a coach.",
     ["cricket", "how-to", "practice", "beginner"],
     ["Shadow the trigger movement first.", "Ten balls on the front foot only.", "Finish with leaves outside off stump."]),
    ("Match Day in 90 Minutes", "sport", "cricket", "PUBLISHED",
     "Warm-up, kit, and what not to overthink before you walk out.",
     ["cricket", "match-day", "routine", "india"],
     ["Arrive early enough to bowl a few.", "Pads on before nerves peak.", "One cue word, not a lecture."]),
    ("Net Session Notes: Front Foot Defence", "sport", "cricket", "PUBLISHED",
     "Head still, stride honest, bat close to pad. Repeat until it is boring.",
     ["cricket", "practice", "how-to"],
     ["Start with underarm feeds.", "Watch the seam, not the bowler's face.", "Film one over and look only at the head."]),
    ("Watching Test Cricket Without Checking the Score", "sport", "cricket", "PUBLISHED",
     "The match is slower when you let an hour happen without a refresh.",
     ["cricket", "slow-living", "opinion"],
     ["Radio if you must move around.", "No second screen.", "Make tea at the drinks break only."]),
    ("The Art of Leaving the Ball", "sport", "cricket", "PUBLISHED",
     "A leave is a shot. Treat it with the same attention as a cover drive.",
     ["cricket", "practice", "opinion"],
     ["Hold the shape after the ball passes.", "Judge off stump from the bowler's hand.", "Count leaves in the nets like runs."]),
    ("Weekend League: What I Pack", "sport", "cricket", "PUBLISHED",
     "A kit list so Saturday morning is not a scavenger hunt.",
     ["cricket", "match-day", "weekend", "how-to"],
     ["Whites, inner gloves, tape.", "Water, banana, spare laces.", "Scorebook pencil even if you hope not to use it."]),
    ("Running Slow on Purpose", "sport", "running", "PUBLISHED",
     "Easy pace is the work. Speed is a garnish.",
     ["running", "beginner", "practice"],
     ["If you cannot talk, you are too fast.", "Same loop for four weeks.", "Hills later. Flat first."]),
    ("Five Kilometres Without Music", "sport", "running", "PUBLISHED",
     "The first kilometre is noisy. After that, the run has a rhythm of its own.",
     ["running", "slow-living", "opinion"],
     ["Leave the headphones at home once a week.", "Count lamp posts instead of splits.", "Notice the dogs, not the pace."]),
    ("How I Came Back After a Twisted Ankle", "sport", "running", "PUBLISHED",
     "Walking first, then strides, then pride. In that order.",
     ["running", "rest", "how-to"],
     ["Pain-free walks for a week.", "Short grass strides.", "No race on the calendar until month two."]),
    ("Rain Runs Are Better Than Perfect Weather", "sport", "running", "PUBLISHED",
     "Wet roads empty the pavements. That is the gift.",
     ["running", "weekend", "opinion"],
     ["Cap, not umbrella.", "Shorter route, same effort.", "Hot shower as part of the session."]),
    ("Strength Work That Doesn't Feel Like a Gym", "sport", "training", "PUBLISHED",
     "Lunges, a backpack, and a park bench. Twenty minutes is enough.",
     ["practice", "beginner", "how-to"],
     ["Squats to a bench.", "Push-ups against a wall if needed.", "Finish with a slow walk home."]),
    ("Rest Days Are Training Too", "sport", "training", "PUBLISHED",
     "The session you skip on purpose is often the one that lets next week happen.",
     ["rest", "habits", "opinion"],
     ["Walk, do not 'active recovery' into another workout.", "Sleep is the actual plan.", "Write the rest day on the calendar."]),
    ("A Simple Warm-Up I Don't Skip", "sport", "training", "PUBLISHED",
     "Five minutes that make the first ball or first kilometre less stupid.",
     ["practice", "how-to", "routine"],
     ["Ankles and hips first.", "Ten easy skips.", "One rehearsal of the first movement."]),
    ("Training When You Only Have 30 Minutes", "sport", "training", "PUBLISHED",
     "Short sessions count if you start them. Waiting for a free evening does not.",
     ["practice", "routine", "how-to"],
     ["Timer on, shoes on.", "One skill, not a full programme.", "Stop at 30 even if you feel heroic."]),
    ("Tuesday Things I Noticed", "life", "notes", "PUBLISHED",
     "A list from an ordinary weekday that did not ask to be remembered.",
     ["field-notes", "slow-living"],
     ["The neighbour's radio through the wall.", "A bus that arrived on time.", "Light on the kitchen floor at 4pm."]),
    ("On Being Slightly Early", "life", "notes", "PUBLISHED",
     "Ten spare minutes is a luxury you can manufacture on most days.",
     ["routine", "opinion", "slow-living"],
     ["Leave before you are ready.", "Carry a book.", "Do not fill the gap with the phone."]),
    ("The Comfort of Repeating the Same Lunch", "life", "notes", "PUBLISHED",
     "Decision fatigue is real. Rice and something green is a kindness.",
     ["routine", "cooking", "slow-living"],
     ["Cook once, pack twice.", "Same tiffin box.", "Change the pickle, not the whole meal."]),
    ("What I Learned From a Dead Phone Battery", "life", "notes", "PUBLISHED",
     "An afternoon without a map, a clock, or a message. It was mostly fine.",
     ["field-notes", "opinion", "tools"],
     ["Ask a person for the time.", "Look up instead of down.", "The errand still got done."]),
    ("What I Cook When I Don't Want to Cook", "life", "kitchen", "PUBLISHED",
     "A 20-minute dal, a pan of onions, and the feeling that dinner happened.",
     ["cooking", "weekend", "how-to"],
     ["Onions, garlic, turmeric, lentils.", "Rice in the cooker first.", "Lemon at the end, always."]),
    ("One Pot, Two Days of Lunch", "life", "kitchen", "PUBLISHED",
     "Batch cooking is not meal prep theatre. It is Tuesday you already handled.",
     ["cooking", "routine", "how-to"],
     ["Double the onions.", "Cool before the fridge.", "Day two gets greens thrown in."]),
    ("The Only Dal Recipe I Need", "life", "kitchen", "PUBLISHED",
     "Masoor, water, patience. Everything else is optional garnish.",
     ["cooking", "india", "beginner"],
     ["Rinse until the water runs quieter.", "Salt late.", "Ghee if you have it, oil if you do not."]),
    ("Grocery Lists That Actually Get Used", "life", "kitchen", "PUBLISHED",
     "Write the list on the fridge, not in an app you will not open in aisle four.",
     ["cooking", "how-to", "tools"],
     ["Group by shop section.", "A hard maximum of twelve items.", "Leave space for one whim."]),
    ("Tea, Then Work", "life", "kitchen", "PUBLISHED",
     "The kettle is the start-of-day ceremony. Email can wait for the second cup.",
     ["cooking", "routine", "deep-work"],
     ["Fill the kettle before you check anything.", "Sit down with the cup.", "Open the notebook, not the inbox."]),
    ("Notes From a Late Train", "life", "travel", "DRAFT",
     "The carriage is a good place to write if you accept that the sentence may stop at a station.",
     ["travel", "field-notes", "slow-living"],
     ["Window seat if you can.", "One page, not a masterpiece.", "Get off when it is your stop, even mid-thought."]),
    ("A Weekend With No Plans", "life", "travel", "PUBLISHED",
     "The hardest part is not booking anything. The rest of the weekend is easy.",
     ["travel", "weekend", "slow-living"],
     ["One neighbourhood walk.", "One long breakfast.", "No photos required."]),
    ("How I Pack a Small Bag", "life", "travel", "PUBLISHED",
     "If it does not earn a place by day two, it should have stayed home.",
     ["travel", "how-to", "tools"],
     ["Two shirts, one sweater.", "Books over gadgets.", "Wear the heavier shoes."]),
    ("The Best Meal Was at the Station", "life", "travel", "PUBLISHED",
     "Platform food has a time limit and a crowd. That is part of the flavour.",
     ["travel", "cooking", "field-notes"],
     ["Eat standing up once.", "Hot tea in a paper cup.", "Do not wait for the 'nice' restaurant later."]),
    ("Walking a New Neighbourhood Without a Map", "life", "travel", "PUBLISHED",
     "Get slightly lost on purpose. Turn toward the busier street when you want out.",
     ["travel", "weekend", "beginner"],
     ["Start from a landmark.", "Notice bakeries, not monuments.", "Take the long way back."]),
    ("Light on the Desk at Four", "culture", "essays", "PUBLISHED",
     "Winter afternoons make a desk feel like a different room. I try to be there for it.",
     ["field-notes", "slow-living", "deep-work"],
     ["Face the window if you can.", "Stop at the first shadow on the page.", "Do not turn the lamp on too early."]),
    ("Borrowing Books From Friends", "culture", "books", "PUBLISHED",
     "A borrowed book arrives with someone else's life already in the margins.",
     ["reading", "review", "slow-living"],
     ["Return it faster than you want to.", "Do not add your own ink.", "Talk about it in person, not in a review."]),
    ("Inbox Zero Is a Mood, Not a Skill", "focus", "deep-work", "PUBLISHED",
     "An empty inbox feels like virtue. It is usually just displacement.",
     ["deep-work", "opinion", "tools"],
     ["Answer the ones that unblock people.", "Archive the rest twice a day.", "Never tidy mail to avoid the hard task."]),
    ("The Second Cup Is Optional", "focus", "habits", "PUBLISHED",
     "Caffeine as a ritual is fine. Caffeine as a personality is not.",
     ["habits", "routine", "opinion"],
     ["Drink water first.", "Walk before the second cup.", "Stop pouring by noon."]),
    ("A Notebook for Only One Project", "focus", "tools", "PUBLISHED",
     "Mixed notebooks become graveyards. One project, one spine.",
     ["tools", "deep-work", "how-to"],
     ["Title the cover.", "Date every entry.", "Retire it when the project ships."]),
    ("Bowling Machine, Human Bowler", "sport", "cricket", "PUBLISHED",
     "Machines are honest. People are better practice for match day.",
     ["cricket", "practice", "opinion"],
     ["Machines for repetition.", "Humans for scramble and chat.", "Do both in the same week."]),
    ("Kit That Lasts a Season", "sport", "cricket", "PUBLISHED",
     "Buy fewer pieces. Repair gloves. Stop chasing new bats mid-year.",
     ["cricket", "tools", "match-day"],
     ["Re-grip before you replace.", "Dry pads overnight.", "One bat in the bag, not three."]),
    ("Why I Run the Same Loop", "sport", "running", "PUBLISHED",
     "Novelty is for weekends. Weekdays need a route the legs already know.",
     ["running", "routine", "habits"],
     ["Same start time.", "Same water tap.", "Change shoes, not the map."]),
    ("Hills Once a Week", "sport", "running", "PUBLISHED",
     "One climb repeated is enough. The rest of the week can be kind.",
     ["running", "practice", "how-to"],
     ["Walk the first one.", "Six repeats, not twelve.", "Easy jog home as cooldown."]),
    ("Bodyweight Before Barbells", "sport", "training", "PUBLISHED",
     "If you cannot control your own weight slowly, the bar can wait.",
     ["practice", "beginner", "how-to"],
     ["Push-ups, squats, a plank.", "Film a set from the side.", "Add load only when form is boring."]),
    ("Sleep Is the Hidden Session", "sport", "training", "PUBLISHED",
     "You cannot out-train a short night. The calendar should admit that.",
     ["rest", "habits", "opinion"],
     ["Same lights-out window.", "No late 'make-up' workouts.", "Skip the session if sleep lost."]),
    ("The Neighbour's Radio", "life", "notes", "PUBLISHED",
     "I used to resent it. Now it is how I know it is Sunday morning.",
     ["field-notes", "slow-living"],
     ["Notice without commenting.", "Let someone else's music be weather.", "Write one line about it and move on."]),
    ("A Chair by the Window", "life", "notes", "PUBLISHED",
     "Most of a good day is a place to sit and a reason not to stand up too fast.",
     ["slow-living", "routine", "opinion"],
     ["Face the light.", "Keep a book on the arm.", "Phone stays in the kitchen."]),
    ("Eggs and Whatever Greens", "life", "kitchen", "PUBLISHED",
     "Breakfast does not need a recipe. It needs a pan and something green from the fridge.",
     ["cooking", "beginner", "weekend"],
     ["Butter, not too hot.", "Greens in at the end.", "Toast if the day looks long."]),
    ("The Spice Tin I Actually Reach For", "life", "kitchen", "PUBLISHED",
     "Cumin, chilli, turmeric. The rest is theatre for guests.",
     ["cooking", "india", "how-to"],
     ["Buy small amounts.", "Smell before you pour.", "Toast cumin in ghee for thirty seconds."]),
    ("Night Bus Window", "life", "travel", "PUBLISHED",
     "Highway sodium lights, a half-read book, and the strange peace of not being able to get off.",
     ["travel", "field-notes", "slow-living"],
     ["Window seat, hoodie up.", "One short essay, not a film.", "Arrive slightly rumpled and unbothered."]),
    ("One Museum, Then Lunch", "life", "travel", "PUBLISHED",
     "Culture as a full-day march is how you remember the gift shop, not the rooms.",
     ["travel", "weekend", "slow-living"],
     ["Two hours inside, maximum.", "Sit on a bench in the last room.", "Eat somewhere ordinary after."]),
    ("Unfinished Essay on Attention", "culture", "essays", "DRAFT",
     "Still gathering examples. The argument is there; the ending is not.",
     ["opinion", "deep-work"],
     ["Collect three more scenes.", "Cut the opening by half.", "Do not publish a shrug."]),
    ("Fielding Drills I Have Not Tried", "sport", "cricket", "DRAFT",
     "A list for the next nets booking — written so I cannot pretend I forgot.",
     ["cricket", "practice", "how-to"],
     ["Short catches off a wall.", "Pick-up and throw at one stump.", "Dive practice on grass, not concrete."]),
    ("A Film I Keep Meaning to Rewatch", "culture", "film", "ARCHIVED",
     "Parked here until the Film section is open again. The note is still useful.",
     ["review", "weekend"],
     ["Watch without a phone.", "One film, not a trilogy.", "Write three sentences after the credits."]),
    ("Welcome to an Earlier Version of This Site", "life", "notes", "ARCHIVED",
     "The first homepage note, kept for the archive rather than the front door.",
     ["field-notes"],
     ["This was the first published line.", "The magazine idea came later.", "Left here so the archive has a beginning."]),
]


def text_node(text: str, **marks) -> dict:
    node = {"type": "text", "text": text}
    if marks:
        node["marks"] = [{"type": name} for name in marks]
    return node


def paragraph(*chunks: str | dict) -> dict:
    content = []
    for chunk in chunks:
        content.append(chunk if isinstance(chunk, dict) else text_node(chunk))
    return {"type": "paragraph", "content": content or None}


def heading(text: str, level: int = 2) -> dict:
    return {"type": "heading", "attrs": {"level": level}, "content": [text_node(text)]}


def bullet_list(items: list[str]) -> dict:
    return {
        "type": "bulletList",
        "content": [
            {
                "type": "listItem",
                "content": [paragraph(item)],
            }
            for item in items
        ],
    }


def table(headers: list[str], rows: list[list[str]]) -> dict:
    def cell(kind: str, value: str) -> dict:
        return {
            "type": kind,
            "content": [paragraph(value)],
        }

    header_row = {
        "type": "tableRow",
        "content": [cell("tableHeader", value) for value in headers],
    }
    body = [
        {"type": "tableRow", "content": [cell("tableCell", value) for value in row]}
        for row in rows
    ]
    return {"type": "table", "content": [header_row, *body]}


def image(src: str, alt: str) -> dict:
    return {"type": "image", "attrs": {"src": src, "alt": alt}}


def build_content(title: str, excerpt: str, bullets: list[str], image_url: str, index: int) -> str:
    extra = [
        f"{title} is less a programme than a way of spending the next hour. "
        "The point is to begin, then to stop while the work is still clean.",
        "Most weeks fail in the gap between intention and the first small action. "
        "This piece is about shrinking that gap until it fits in an ordinary Tuesday.",
        "I keep notes like this so the next time the same problem shows up, "
        "I do not have to invent the whole answer again.",
    ]
    nodes = [
        paragraph(excerpt),
        heading("Where this started"),
        paragraph(extra[index % len(extra)]),
        image(image_url, title),
        heading("What I actually do"),
        bullet_list(bullets),
        heading("A simple table"),
        table(
            ["Step", "Minutes", "Focus"],
            [
                ["Prepare", "5", "Clear the desk or the kit"],
                ["Do the work", "20", bullets[0][:42]],
                ["Stop", "5", "Write one line about what happened"],
            ],
        ),
        heading("What I leave out"),
        paragraph(
            "I leave out the extra system, the extra purchase, and the extra hour of planning. "
            "If it cannot be done with what is already in the room, it waits."
        ),
        paragraph(
            "If this is useful, try it once this week and ignore it if it is not. "
            "The archive will still be here tomorrow."
        ),
    ]
    return json.dumps({"type": "doc", "content": nodes})


def placeholder_jpeg(label: str) -> bytes:
    colors = [
        (32, 42, 48),
        (64, 52, 44),
        (48, 56, 48),
        (42, 42, 58),
    ]
    color = colors[sum(ord(ch) for ch in label) % len(colors)]
    image = Image.new("RGB", (1400, 900), color)
    draw = ImageDraw.Draw(image)
    draw.rectangle([0, 760, 1400, 900], fill=(12, 12, 12))
    font = ImageFont.load_default()
    draw.text((48, 800), label[:48], fill=(245, 240, 232), font=font)
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=86)
    return buffer.getvalue()


def download_photo(photo_id: str) -> bytes | None:
    url = UNSPLASH.format(photo=photo_id)
    request = Request(url, headers={"User-Agent": "blogging-website-seed/1.0"})
    try:
        with urlopen(request, timeout=20) as response:
            data = response.read()
        if data[:3] in (b"\xff\xd8\xff", b"\x89PN") or data[:4] == b"RIFF":
            return data
    except Exception:
        return None
    return None


def save_media_file(db, original_name: str, data: bytes) -> Media:
    ensure_upload_dir()
    filename = f"{uuid.uuid4().hex}.jpg"
    destination = UPLOAD_DIR / filename
    destination.write_bytes(data)
    thumb_name = create_thumbnail(destination, thumb_filename_for(filename))
    media = Media(
        filename=filename,
        original_name=original_name,
        content_type="image/jpeg",
        size_bytes=len(data),
        url_path=build_public_path(filename),
        thumb_filename=thumb_name,
        thumb_url_path=build_public_path(thumb_name) if thumb_name else None,
    )
    db.add(media)
    db.flush()
    return media


def get_or_create_tag(db, name: str) -> Tag:
    tag_slug = slugify(name)
    tag = db.query(Tag).filter(Tag.slug == tag_slug).first()
    if tag:
        return tag
    tag = Tag(name=name, slug=tag_slug)
    db.add(tag)
    db.flush()
    return tag


def seed() -> None:
    from app.database import Base, ensure_blog_columns

    Base.metadata.create_all(bind=engine)
    ensure_blog_columns()

    db = SessionLocal()
    created = {"categories": 0, "subcategories": 0, "tags": 0, "media": 0, "blogs": 0}

    try:
        categories_by_slug: dict[str, Category] = {}
        subs_by_slug: dict[str, Subcategory] = {}

        for spec in CATEGORIES:
            category = db.query(Category).filter(Category.slug == spec["slug"]).first()
            if not category:
                category = Category(
                    name=spec["name"],
                    slug=spec["slug"],
                    description=spec["description"],
                    status=spec["status"],
                )
                db.add(category)
                db.flush()
                created["categories"] += 1
            categories_by_slug[category.slug] = category

            for name, sub_slug, description in spec["subs"]:
                subcategory = (
                    db.query(Subcategory).filter(Subcategory.slug == sub_slug).first()
                )
                status = "disabled" if sub_slug in DISABLED_SUBS else "active"
                if not subcategory:
                    subcategory = Subcategory(
                        category_id=category.id,
                        name=name,
                        slug=sub_slug,
                        description=description,
                        status=status,
                    )
                    db.add(subcategory)
                    db.flush()
                    created["subcategories"] += 1
                else:
                    subcategory.status = status
                    subcategory.description = description
                subs_by_slug[sub_slug] = subcategory

        for name in TAGS:
            existing = db.query(Tag).filter(Tag.slug == slugify(name)).first()
            if not existing:
                db.add(Tag(name=name, slug=slugify(name)))
                created["tags"] += 1
        db.flush()

        media_items = db.query(Media).order_by(Media.id).all()
        if len(media_items) < len(PHOTOS):
            print("Downloading photos for the media library...")
            for index, photo_id in enumerate(PHOTOS):
                original = f"{photo_id.replace('photo-', 'unsplash-')}.jpg"
                already = (
                    db.query(Media).filter(Media.original_name == original).first()
                )
                if already:
                    continue
                data = download_photo(photo_id) or placeholder_jpeg(photo_id)
                media_items.append(save_media_file(db, original, data))
                created["media"] += 1
                print(f"  saved image {index + 1}/{len(PHOTOS)}")
        if not media_items:
            media_items = db.query(Media).order_by(Media.id).all()

        now = datetime.now(timezone.utc)
        for index, (
            title,
            cat_slug,
            sub_slug,
            status,
            excerpt,
            tag_names,
            bullets,
        ) in enumerate(POSTS):
            post_slug = slugify(title)
            existing = db.query(Blog).filter(Blog.slug == post_slug).first()
            if existing:
                continue

            media = media_items[index % len(media_items)]
            image_url = f"{PUBLIC_API}{media.url_path}"
            thumb_url = (
                f"{PUBLIC_API}{media.thumb_url_path}" if media.thumb_url_path else None
            )
            published_at = None
            if status == "PUBLISHED":
                published_at = now - timedelta(days=index + 1, hours=index % 7)
            elif status == "ARCHIVED":
                published_at = now - timedelta(days=120 + index)

            blog = Blog(
                category_id=categories_by_slug[cat_slug].id,
                subcategory_id=subs_by_slug[sub_slug].id,
                title=title,
                slug=post_slug,
                excerpt=excerpt,
                featured_image=image_url,
                featured_image_thumb=thumb_url,
                content=build_content(title, excerpt, bullets, image_url, index),
                seo_title=f"{title} — BlogSite",
                seo_description=excerpt,
                status=status,
                published_at=published_at,
            )
            db.add(blog)
            db.flush()
            blog.tags = [get_or_create_tag(db, name) for name in tag_names]
            created["blogs"] += 1

        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

    totals = {
        "categories": db_count(Category),
        "subcategories": db_count(Subcategory),
        "tags": db_count(Tag),
        "media": db_count(Media),
        "blogs": db_count(Blog),
        "published": db_count(Blog, Blog.status == "PUBLISHED"),
        "drafts": db_count(Blog, Blog.status == "DRAFT"),
        "archived": db_count(Blog, Blog.status == "ARCHIVED"),
    }
    print("Created this run:", created)
    print("Database totals:", totals)


def db_count(model, *filters) -> int:
    db = SessionLocal()
    try:
        query = db.query(model)
        if filters:
            query = query.filter(*filters)
        return query.count()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
