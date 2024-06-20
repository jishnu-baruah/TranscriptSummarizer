from flask import Flask, render_template, request, jsonify
from flask_pymongo import PyMongo
import random
import os





app = Flask(__name__)
app.config["MONGO_URI"] = 'mongodb+srv://jsbaruah1:gxXhCoiBJ1434sdB@cluster0.dkwkqtt.mongodb.net/test?retryWrites=true&w=majority'

mongo = PyMongo(app)


MAX_CACHE_SIZE = 10
local_cache = []

@app.route("/")
def index():
    global local_cache
    if not local_cache or len(local_cache) < MAX_CACHE_SIZE:
        facts_collection = mongo.db.facts
        random_fact = facts_collection.aggregate([{"$sample": {"size": 1}}])
        for fact in random_fact:
            fact_text = fact["fact"]
            local_cache.append(fact_text)
    random_fact = random.choice(local_cache) if local_cache else "No facts available"
    return render_template("index.html", fact=random_fact)

@app.route("/allfacts")
def show_all_facts():
    facts_collection = mongo.db.facts
    all_facts = list(facts_collection.find({}, {"_id": 0, "fact": 1}))
    return jsonify({"facts": all_facts})

@app.route("/randomfact")
def show_random_fact():
    facts_collection = mongo.db.facts
    random_fact = facts_collection.aggregate([{"$sample": {"size": 1}}])
    fact_text = next(random_fact, None)
    return jsonify({"fact": fact_text["fact"]} if fact_text else "No facts available")

@app.route("/postfact", methods=["POST"])
def post_fact():
    new_fact = request.form.get("new_fact")
    if new_fact:
        facts_collection = mongo.db.facts
        facts_collection.insert_one({"fact": new_fact})
        if len(local_cache) < MAX_CACHE_SIZE:
            local_cache.append(new_fact)
    return index()

@app.route("/test_db_connection")
def test_db_connection():
    try:
        mongo.db.command("ping")
        return jsonify({"message": "Database connection successful"})
    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == "__main__":
    app.run(debug=True)
