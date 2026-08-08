# ============================================================
#  Ust seviye CMake yapilandirmasi
# ============================================================
# Depo iki bolumden olusuyor:
#   engine/  -> C++ satranc motoru (bagimsiz derlenebilir)
#   app/     -> React Native uygulamasi (Adim 1'de eklenecek)
#
# Motor kendi CMakeLists.txt'sine sahip ve tek basina derlenebiliyor.
# Android tarafi da onu dogrudan add_subdirectory ile dahil edecek.
cmake_minimum_required(VERSION 3.15)
project(ChessEngineProject LANGUAGES CXX)

add_subdirectory(engine)