<?php

use Illuminate\Support\Facades\Route;

Route::inertia('/', 'Welcome')->name('home');

// Bez auth middlewarea za sada — autentifikacija dolazi u Etapi 8.
Route::inertia('editor', 'Editor')->name('editor');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'Dashboard')->name('dashboard');
});

require __DIR__.'/settings.php';
