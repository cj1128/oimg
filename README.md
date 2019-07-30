# oimg

A thin wrapper around `imagemin` to compress images.

## Find the target

First, we need to find the images which need to be compressed.

I didn't implement this function in this tool, because some simple and elegant shell pipes can do the job.

```bash
# fd is the modern version of find
# bat is the modern version of cat
fd -e png -e jpeg -e jpg -e svg '' . |\
xargs ls -l |\
sort -nk5 -r |\
awk '{print $9,$5}' |\
numfmt --field=2 --to=iec |\
column -t | bat
```

![](http://ww1.sinaimg.cn/large/9b85365dgy1g5i03r4vdnj20h7051wfj)

## Install

`yarn global add oimg`.

## Usage

`file` could be a specific file or a glob, like `images/*.jpg`.

```bash
oimg [flags] file...

Options:
  --webp              whether or not to convert jpgs and pngs to webp
                                                                [default: false]
  -h, --help          Show help                                        [boolean]
  -v, --version       Show version number                              [boolean]
  --output                                                     [default: "dist"]
  --jpg-quality                                                    [default: 70]
  --png-quality                                            [default: "0.65,0.8"]
  --webp-jpg-quality                                               [default: 75]
  --webp-png-quality                                               [default: 85]
```
