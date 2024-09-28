const { ethers } = require('ethers');
const readline = require('readline');

// Konfigurasi
const config = {
    privateKey: '', // Ganti dengan private key Anda
};

// Fungsi untuk menunggu
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fungsi untuk menangani transaksi token
async function handleTokenTransaction(network) {
    const provider = new ethers.JsonRpcProvider(network.rpcUrl);
    const wallet = new ethers.Wallet(config.privateKey, provider);

    const tokenContractAddress = network.tokenContractAddress;
    const tokenAbi = [
        "function transfer(address to, uint amount) public returns (bool)",
        "function balanceOf(address account) public view returns (uint)",
        "function decimals() public view returns (uint8)"
    ];

    const tokenContract = new ethers.Contract(tokenContractAddress, tokenAbi, wallet);

    const recipient = '0xf64d3CeFdAe63560C8b1E1D0f134a54988F5260E'; // Ganti dengan alamat penerima

    while (true) {
        try {
            // Mengambil saldo token
            const balance = await tokenContract.balanceOf(wallet.address);
            const decimals = await tokenContract.decimals();
            const amountToSend = balance; // Menggunakan semua saldo

            if (amountToSend.isZero()) {
                console.log("Saldo kosong. Menunggu untuk transaksi berikutnya...");
                await wait(1000); // Tunggu 1 detik jika saldo kosong
                continue;
            }

            // Menghitung biaya gas
            const gasLimit = await tokenContract.estimateGas.transfer(recipient, amountToSend);
            const gasPrice = await provider.getGasPrice();
            const totalGasCost = gasLimit.mul(gasPrice);

            // Memeriksa apakah saldo cukup untuk biaya gas
            const walletBalance = await provider.getBalance(wallet.address);
            if (walletBalance.lt(totalGasCost)) {
                console.log("Saldo tidak cukup untuk biaya gas. Menunggu untuk transaksi berikutnya...");
                await wait(1000); // Tunggu 1 detik jika saldo tidak cukup
                continue;
            }

            // Melakukan transfer
            const tx = await tokenContract.transfer(recipient, amountToSend);
            console.log("Transaksi berhasil:", tx.hash);
            
            // Tunggu konfirmasi transaksi
            await tx.wait();
            console.log("Transaksi telah dikonfirmasi.");

            // Tunggu 0.1 detik sebelum transaksi berikutnya
            await wait(100); // 0.1 detik
        } catch (error) {
            console.error("Terjadi kesalahan saat melakukan transaksi:", error);
            // Tunggu 1 detik sebelum mencoba lagi jika terjadi kesalahan
            await wait(1000);
        }
    }
}

// Contoh pemanggilan fungsi
const network = {
    rpcUrl: 'https://arb1.arbitrum.io/rpc', // Ganti dengan URL RPC Anda
    tokenContractAddress: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', // Ganti dengan alamat kontrak token Anda
};

// Memanggil fungsi
handleTokenTransaction(network);
