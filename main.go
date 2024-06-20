package main

import (
	"flag"
	"fmt"
	"os"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/joho/godotenv"

	"github.com/0glabs/0g-storage-client/common/blockchain"
	"github.com/0glabs/0g-storage-client/contract"
	"github.com/0glabs/0g-storage-client/core"
	"github.com/0glabs/0g-storage-client/node"
	"github.com/0glabs/0g-storage-client/transfer"
)

type uploadArgs struct {
	file      string
	tags      string
	url       string
	contract  string
	key       string
	force     bool
	taskSize  uint
}

func uploadFile(client *node.Client, filePath string) {
	err := godotenv.Load()
	if err != nil {
		fmt.Println("Error loading .env file:", err)
		return
	}

	args := uploadArgs{
		file:     filePath,
		tags:     "0x", // Example tags
		url:      "https://rpc-testnet.0g.ai",
		contract: "0xb8F03061969da6Ad38f0a4a9f8a86bE71dA3c8E7",
		key:      os.Getenv("PRIVATE_KEY"),
		force:    false,
		taskSize: 10,
	}

	w3client := blockchain.MustNewWeb3(args.url, args.key)
	defer w3client.Close()

	contractAddr := common.HexToAddress(args.contract)

	flowContract, err := contract.NewFlowContract(contractAddr, w3client)
	if err != nil {
		fmt.Println("Error creating contract:", err)
		return
	}

	uploader, err := transfer.NewUploader(flowContract, []*node.Client{client})
	if err != nil {
		fmt.Println("Error creating uploader:", err)
		return
	}

	opt := transfer.UploadOption{
		Tags:     hexutil.MustDecode(args.tags),
		Force:    args.force,
		TaskSize: args.taskSize,
	}

	file, err := core.Open(args.file)
	if err != nil {
		fmt.Println("Error opening file:", err)
		return
	}
	defer file.Close()

	if err := uploader.Upload(file, opt); err != nil {
		fmt.Println("Error uploading file:", err)
		return
	}

	fmt.Println("File uploaded successfully.")
}

func main() {
	ip := "https://rpc-storage-testnet.0g.ai"

	client, err := node.NewClient(ip)
	if err != nil {
		fmt.Println("Error creating client:", err)
		return
	}

	status, err := client.ZeroGStorage().GetStatus()
	if err != nil {
		fmt.Println("Error getting status:", err)
		return
	}

	fmt.Println(status)

	// Parse command-line arguments
	filePath := flag.String("file", "", "Path to the transcript file")
	flag.Parse()

	if *filePath == "" {
		fmt.Println("Please provide the path to the transcript file using the -file flag.")
		os.Exit(1)
	}

	// Upload the file
	uploadFile(client, *filePath)
}