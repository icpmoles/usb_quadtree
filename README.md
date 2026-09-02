## Recreate JSON database

Install dependencies

```
source .venv/bin/activate
pip3 install -r requirements.txt
```


In `data` folder:

```
wget http://www.linux-usb.org/usb.ids
```

or as an alternative:

```
wget https://sourceforge.net/p/linux-usb/repo/HEAD/tree/trunk/htdocs/usb.ids?format=raw
```

In an editor delete everything below

```
# List of known device classes, subclasses and protocols
```

Launch python script

## Launch http server (needed to fetch JSON if in local)

```
launch_server.sh
```
