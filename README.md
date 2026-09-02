## Recreate JSON database

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
