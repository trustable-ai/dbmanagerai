import os

def echo(args):
  for k, v in os.environ.items():
    print(f"{k}={v}")
  return args
