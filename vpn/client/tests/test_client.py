import base64
import io
import os
import tempfile
import unittest
from contextlib import redirect_stdout, redirect_stderr
from pathlib import Path

from shadowvpn import backend, cli, config

KEY = base64.b64encode(b"k" * 32).decode()
GOOD = f"""[Interface]
PrivateKey = {KEY}
Address = 10.13.13.2/32
DNS = 1.1.1.1

[Peer]
PublicKey = {KEY}
PresharedKey = {KEY}
Endpoint = vpn.example.com:51820
AllowedIPs = 0.0.0.0/0, ::/0
PersistentKeepalive = 25
"""


class ConfigTests(unittest.TestCase):
    def test_parse_good(self):
        cfg = config.parse(GOOD)
        self.assertEqual(cfg.addresses, ["10.13.13.2/32"])
        self.assertEqual(cfg.endpoints, ["vpn.example.com:51820"])
        self.assertEqual(cfg.peers[0].get_list("AllowedIPs"), ["0.0.0.0/0", "::/0"])
        self.assertFalse(cfg.has_hooks)

    def test_bad_key(self):
        with self.assertRaises(config.ConfigError):
            config.parse(GOOD.replace(f"PrivateKey = {KEY}", "PrivateKey = abc"))

    def test_missing_peer(self):
        with self.assertRaises(config.ConfigError):
            config.parse(GOOD.split("[Peer]")[0])

    def test_bad_endpoint(self):
        with self.assertRaises(config.ConfigError):
            config.parse(GOOD.replace("vpn.example.com:51820", "vpn.example.com"))

    def test_unknown_key(self):
        with self.assertRaises(config.ConfigError):
            config.parse(GOOD.replace("DNS = 1.1.1.1", "Foo = bar"))

    def test_redact(self):
        out = config.redact(GOOD)
        self.assertNotIn(KEY, out.split("[Peer]")[0])
        self.assertIn("PublicKey = " + KEY, out)
        self.assertEqual(out.count("(скрыто)"), 2)

    def test_profile_name(self):
        config.validate_profile_name("home-vpn")
        for bad in ("", "a" * 16, "with space", "../etc"):
            with self.assertRaises(config.ConfigError):
                config.validate_profile_name(bad)


class BackendTests(unittest.TestCase):
    def test_parse_dump(self):
        dump = ("priv\tpub\t0\toff\n"
                "PUB\tPSK\t1.2.3.4:51820\t10.13.13.0/24\t1700000000\t2048\t4096\t25\n")
        st = backend.parse_dump("wg0", dump)
        self.assertEqual(len(st.peers), 1)
        self.assertEqual(st.peers[0].endpoint, "1.2.3.4:51820")
        self.assertEqual(st.peers[0].rx, 2048)

    def test_human(self):
        self.assertEqual(backend.human_bytes(512), "512 Б")
        self.assertEqual(backend.human_bytes(2048), "2.0 КиБ")
        self.assertEqual(backend.human_ago(0), "ещё не было")
        self.assertEqual(backend.human_ago(100, now=130), "30 с назад")


class CliTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.home = self.tmp.name
        self.src = Path(self.home) / "laptop.conf"
        self.src.write_text(GOOD)

    def tearDown(self):
        self.tmp.cleanup()

    def run_cli(self, *argv):
        out, err = io.StringIO(), io.StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            code = cli.main(["--home", self.home, *argv])
        return code, out.getvalue(), err.getvalue()

    def test_import_list_show_remove(self):
        code, out, _ = self.run_cli("import", str(self.src))
        self.assertEqual(code, 0)
        saved = Path(self.home) / "profiles" / "laptop.conf"
        self.assertTrue(saved.exists())
        if os.name == "posix":
            self.assertEqual(saved.stat().st_mode & 0o777, 0o600)

        code, out, _ = self.run_cli("list")
        self.assertIn("laptop", out)
        self.assertIn("vpn.example.com:51820", out)

        code, out, _ = self.run_cli("show", "laptop")
        self.assertIn("(скрыто)", out)

        code, _, err = self.run_cli("import", str(self.src))
        self.assertEqual(code, 1)
        self.assertIn("--force", err)

        self.assertEqual(self.run_cli("remove", "laptop")[0], 0)
        self.assertFalse(saved.exists())

    def test_hooks_require_flag(self):
        self.src.write_text(GOOD.replace("DNS = 1.1.1.1", "DNS = 1.1.1.1\nPostUp = rm -rf /"))
        code, _, err = self.run_cli("import", str(self.src))
        self.assertEqual(code, 1)
        self.assertIn("--allow-hooks", err)


if __name__ == "__main__":
    unittest.main()
