# a simple python script which scrapes usaco problems in usaco.guide's extraproblems
# plug: usaco.guide is a rly good resource for practicing usaco, btw -W-

import json

problems = "imported from cpi/usaco-guide/content/extraproblems.json"

problem_lk = json.loads(problems)

def get_div(div):
  for i in problem_lk['EXTRA_PROBLEMS']:
    x = {}
    res = []

    if i['source'] == div:
      x['name'] = i['name']
      x['url'] = i['url']
      if ('tags' in i):
        x['tags'] = i['tags']
      else:
        x['tags'] = []
      res.append(x)

  print(str(res).replace("'", '"'), file=open(div + ".json", "w"))

def get_tags(div):
  x = set()
  for i in problem_lk['EXTRA_PROBLEMS']:

    if i['source'] == div:
      if ('tags' in i):
        for j in i['tags']:
          x.add(j)

  return str(x).replace("'", '"')

get_div("Bronze")
get_div("Silver")
get_div("Gold")
get_div("Plat")
print(get_tags("Bronze"))
print(get_tags("Silver"))
print(get_tags("Gold"))
print(get_tags("Plat"))