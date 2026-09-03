from pathlib import Path
from lark import Lark, Transformer
import json
import csv


class VendorTransformer(Transformer):
    def start(self, items):
        return items

    def vendor(self, items):
        vendor_id = str(items[0])
        name = str(items[1]).strip()

        children = [
            {
                "id": str(item[0]),
                "name": str(item[1]).strip(),
            }
            for item in items[2:]
        ]

        return {
            "id": vendor_id,
            "name": name,
            "devices": children,
        }

    def child(self, items):
        return items


parser = Lark.open(
    "vendors.lark",
    rel_to=__file__,
    parser="lalr",
)


text = Path("data/usb.ids").read_text(encoding="utf-8")

tree = parser.parse(text)
data = VendorTransformer().transform(tree)

all_vendors = {}
full_list = {}

for vendor in data:
    # print(vendor)
    all_vendors[vendor["id"]] = vendor["name"]
    full_list[vendor["id"]] = vendor
# print(all_vendors)


with open("public/vendors.json", "w", encoding="utf-8") as f:
    json.dump(all_vendors, f, indent=2, ensure_ascii=False)

with open("full_list.json", "w", encoding="utf-8") as f:
    json.dump(full_list, f, indent=2, ensure_ascii=False)


with open("vendors.tsv", "w", newline="") as f:
    csv_writer = csv.writer(f, delimiter="\t", quotechar="'", quoting=csv.QUOTE_MINIMAL)
    csv_writer.writerow(["vendor", "vid", "msb_hex", "lsb_hex", "msb_dec", "lsb_dec"])

    for vid, l_vendor in all_vendors.items():
        msb = vid[0:2]
        lsb = vid[2:4]

        msb_dec = int(msb, 16)
        lsb_dec = int(lsb, 16)

        csv_writer.writerow([l_vendor, vid, msb, lsb, msb_dec, lsb_dec])
