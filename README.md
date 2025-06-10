# Quick install guide

### 1. Create virtual enviornment

```
python -m venv weatherapp
```

### 2. Go to env dir and clone repo

```
cd weatherapp
source scripts/activate
mkdir src
cd src
git clone https://github.com/Nader-Ahmed-Khater/WeatherApp
```

### 3. install dependencies 

```
cd weatherapp
pip install -r requirements.txt
```

### 4. Migrate and load data

```
python manage.py migrate
python manage.py loaddata data.json
```

### 5. Run the app
```
python manage.py runserver
```
